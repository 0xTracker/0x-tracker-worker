require('moment-round');

const _ = require('lodash');
const bluebird = require('bluebird');
const signale = require('signale');

const { BASE_TOKENS, ZRX_TOKEN_ADDRESS } = require('../../constants');
const Fill = require('../../model/fill');
const getLocalisedAmount = require('./get-localised-amount');
const getRatesForFill = require('./get-rates-for-fill');
const localizeTokenAmount = require('./localize-token-amount');
const tokenCache = require('../../tokens/token-cache');

const logger = signale.scope('update fill rates');

const updateFillRates = async ({ batchSize, processOldestFirst }) => {
  const tokens = tokenCache.getTokens();
  const baseTokens = _.keys(BASE_TOKENS);

  const fills = await Fill.find({
    'rates.saved': { $in: [null, false] },
    $or: [
      { makerToken: { $in: baseTokens } },
      { takerToken: { $in: baseTokens } },
    ],
  })
    .sort({ date: processOldestFirst ? 1 : -1 })
    .limit(batchSize)
    .lean();

  if (fills.length === 0) {
    logger.info('no fills were found without rates');
    return;
  }

  logger.info(`${fills.length} fills were found without rates`);

  const zrxToken = tokens[ZRX_TOKEN_ADDRESS];

  await bluebird.mapSeries(fills, async fill => {
    const rates = await getRatesForFill(fill);

    if (rates === null) {
      logger.warn(`unable to get rates for ${fill._id}`);
      return;
    }

    await Fill.updateOne(
      { _id: fill._id },
      {
        $set: {
          conversions: {
            USD: {
              amount: getLocalisedAmount(fill, tokens, rates),
              makerFee: localizeTokenAmount(fill.makerFee, zrxToken, rates),
              takerFee: localizeTokenAmount(fill.takerFee, zrxToken, rates),
            },
          },
          rates: {
            data: rates,
            saved: true,
          },
        },
      },
    );

    logger.success(`updated rates for ${fill._id}`);

    await bluebird.delay(100); // limit the number of API requests made per second
  });

  logger.success(`updated rates for ${fills.length} fills`);
};

module.exports = updateFillRates;
