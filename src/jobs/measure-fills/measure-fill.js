const bluebird = require('bluebird');
const signale = require('signale');

const { JOB, QUEUE } = require('../../constants');
const { getToken } = require('../../tokens/token-cache');
const { publishJob } = require('../../queues');
const formatTokenAmount = require('../../tokens/format-token-amount');
const getConversionRate = require('../../rates/get-conversion-rate');
const getMeasurableActor = require('./get-measurable-actor');
const normalizeSymbol = require('../../tokens/normalize-symbol');
const persistTokenPrices = require('./persist-token-prices');
const withTransaction = require('../../util/with-transaction');

const logger = signale.scope('measure fills > measure fill');

const measureFill = async fill => {
  const measurableActor = getMeasurableActor(fill);

  let totalValue = 0;
  const tokenPrices = {};

  await bluebird.mapSeries(fill.assets, async asset => {
    if (asset.actor === measurableActor) {
      const token = getToken(asset.tokenAddress);

      if (token === undefined) {
        throw new Error(
          `Unable to fetch resolved token ${asset.tokenAddress} from token cache`,
        );
      }

      const amount = formatTokenAmount(asset.amount, token);
      const normalizedSymbol = normalizeSymbol(token.symbol);
      const conversionRate = await getConversionRate(
        normalizedSymbol,
        'USD',
        fill.date,
      );

      if (conversionRate === undefined) {
        throw new Error(
          `Unable to fetch USD price of ${normalizedSymbol} on ${fill.date}`,
        );
      }

      tokenPrices[token.address] = conversionRate;

      const assetValue = amount * conversionRate;

      asset.set('price.USD', conversionRate);
      asset.set('value.USD', assetValue);

      logger.debug(
        `set price of token ${token.address} to ${conversionRate} on fill ${fill._id}`,
      );

      totalValue += assetValue;
    }
  });

  fill.set('conversions.USD.amount', totalValue);
  fill.set('hasValue', true);

  await withTransaction(async session => {
    await fill.save({ session });
    await persistTokenPrices(tokenPrices, fill, session);
    await publishJob(QUEUE.FILL_INDEXING, JOB.INDEX_FILL_VALUE, {
      fillId: fill._id,
      value: totalValue,
    });
  });

  logger.debug(`set value of fill ${fill._id} to ${totalValue}`);
};

module.exports = measureFill;
