const _ = require('lodash');
const bluebird = require('bluebird');
const signale = require('signale');

const { BASE_TOKENS } = require('../constants');
const Fill = require('../model/fill');
const formatTokenAmount = require('../tokens/format-token-amount');
const getBaseToken = require('../fills/get-base-token');
const getConversionRate = require('../rates/get-conversion-rate');
const normalizeSymbol = require('../tokens/normalize-symbol');
const withTransaction = require('../util/with-transaction');

const logger = signale.scope('determine fill values');

const getTokenValue = (fill, baseToken) => {
  if (fill.makerToken === baseToken.address) {
    return formatTokenAmount(fill.makerAmount, baseToken);
  }

  return formatTokenAmount(fill.takerAmount, baseToken);
};

const determineFillValues = async ({ apiDelayMs, batchSize }) => {
  const baseTokens = _.keys(BASE_TOKENS);

  logger.time('fetch batch of fills');
  const fills = await Fill.find({
    hasValue: false,
    $or: [
      { makerToken: { $in: baseTokens } },
      { takerToken: { $in: baseTokens } },
    ],
  })
    .limit(batchSize)
    .lean();
  logger.timeEnd('fetch batch of fills');

  logger.info(`found ${fills.length} measurable fills without a value`);

  if (fills.length === 0) {
    return;
  }

  await bluebird.mapSeries(fills, async fill => {
    const baseToken = getBaseToken(fill);

    if (baseToken === null || baseToken === undefined) {
      logger.warn(`unable to determine base token of fill ${fill._id}`);

      return;
    }

    const normalisedSymbol = normalizeSymbol(baseToken.symbol);

    logger.time(
      `fetch conversion rate for ${normalisedSymbol} on ${fill.date}`,
    );
    const conversionRate = await getConversionRate(
      normalisedSymbol,
      'USD',
      fill.date,
    );
    logger.timeEnd(
      `fetch conversion rate for ${normalisedSymbol} on ${fill.date}`,
    );

    if (conversionRate === undefined) {
      logger.warn(
        `unable to determine conversion rate of ${normalisedSymbol} on ${fill.date}`,
      );

      return;
    }

    const tokenValue = getTokenValue(fill, baseToken);
    const usdValue = tokenValue * conversionRate;

    await withTransaction(async session => {
      await Fill.updateOne(
        { _id: fill._id },
        {
          $set: {
            'conversions.USD.amount': usdValue,
            [`rates.data.${normalisedSymbol}.USD`]: conversionRate,
            hasValue: true,
          },
        },
        {
          session,
        },
      );

      if (fill.assets !== null) {
        await Fill.updateOne(
          { _id: fill._id },
          {
            $set: {
              'assets.$[asset].price.USD': conversionRate,
            },
          },
          {
            arrayFilters: [
              {
                'asset.tokenAddress': baseToken.address,
              },
            ],
            session,
          },
        );
      }
    });

    logger.success(`determined fill value for ${fill._id}`);

    // limit the number of API requests made per second to avoid errors
    await bluebird.delay(apiDelayMs);
  });
};

module.exports = determineFillValues;
