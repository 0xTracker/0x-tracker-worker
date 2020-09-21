const bluebird = require('bluebird');

const { publishJob } = require('../../queues');
const {
  BASE_TOKENS,
  BASE_TOKEN_DECIMALS,
  QUEUE,
  JOB,
} = require('../../constants');
const formatTokenAmount = require('../../tokens/format-token-amount');
const getAppAttributionsForFill = require('../../fills/get-app-attributions-for-fill');
const getConversionRate = require('../../rates/get-conversion-rate');
const getMeasurableActor = require('./get-measurable-actor');
const indexFillValue = require('../../index/index-fill-value');
const indexFillTraders = require('../../index/index-fill-traders');
const indexTradedTokens = require('../../index/index-traded-tokens');
const normalizeSymbol = require('../../tokens/normalize-symbol');
const withTransaction = require('../../util/with-transaction');

const measureFill = async fill => {
  const measurableActor = getMeasurableActor(fill);

  let totalValue = 0;

  const tokenPrices = {};
  const tokenValues = {};

  await bluebird.mapSeries(fill.assets, async asset => {
    if (asset.actor === measurableActor) {
      const { tokenAddress } = asset;
      const tokenSymbol = BASE_TOKENS[asset.tokenAddress];
      const tokenDecimals = BASE_TOKEN_DECIMALS[asset.tokenAddress];

      if (tokenSymbol === undefined) {
        throw new Error(
          `Could not determine symbol for base token: ${tokenAddress}`,
        );
      }

      if (tokenDecimals === undefined) {
        throw new Error(
          `Could not determine decimals for base token: ${tokenAddress}`,
        );
      }

      const tokenAmount = formatTokenAmount(asset.amount, tokenDecimals);
      const normalizedSymbol = normalizeSymbol(tokenSymbol);
      const tokenPrice = await getConversionRate(
        normalizedSymbol,
        'USD',
        fill.date,
      );

      if (tokenPrice === undefined) {
        throw new Error(
          `Unable to fetch USD price of ${normalizedSymbol} on ${fill.date}`,
        );
      }

      const tokenAmountUSD = tokenAmount * tokenPrice;

      tokenPrices[tokenAddress] = tokenPrice;

      asset.set('price.USD', tokenPrice);
      asset.set('value.USD', tokenAmountUSD);

      if (tokenValues[tokenAddress] === undefined) {
        tokenValues[tokenAddress] = {
          amount: tokenAmount.toNumber(),
          amountUSD: tokenAmountUSD,
          priceUSD: tokenPrice,
        };
      } else {
        tokenValues[tokenAddress].amount += tokenAmount.toNumber();
        tokenValues[tokenAddress].amountUSD += tokenAmountUSD;
      }

      totalValue += tokenAmountUSD;
    }
  });

  fill.set('conversions.USD.amount', totalValue);
  fill.set('hasValue', true);

  await withTransaction(async session => {
    await fill.save({ session });
    await indexFillValue(fill, totalValue);
    await indexFillTraders(fill);
    await indexTradedTokens(fill);

    if (fill.apps.length > 0) {
      await publishJob(QUEUE.INDEXING, JOB.INDEX_APP_FILL_ATTRIBUTONS, {
        attributions: getAppAttributionsForFill(fill),
        date: fill.date,
        fillId: fill._id,
      });
    }
  });
};

module.exports = measureFill;
