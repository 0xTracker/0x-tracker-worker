const _ = require('lodash');
const { compact, flow, map } = require('lodash/fp');
const flattenObject = require('flat');
const signale = require('signale');

const { FILL_ACTOR } = require('../../constants');
const Fill = require('../../model/fill');
const getPrices = require('./get-prices-for-fill');
const getRelayerPrices = require('./get-relayer-prices');
const Relayer = require('../../model/relayer');
const tokenCache = require('../../tokens/token-cache');
const withTransaction = require('../../util/with-transaction');

const logger = signale.scope('derive fill prices');

// This job is currently very poorly written. Once assets have been migrated
// to the assets field and makerPrice/takerPrice have been deprecated, it can be cleaned up.
const deriveFillPrices = async ({ batchSize }) => {
  logger.time('fetch batch of fills');
  const fills = await Fill.find({
    hasValue: true,
    'prices.saved': false,
    assets: {
      $all: [{ tokenResolved: true }],
    },
  }).limit(batchSize);
  logger.timeEnd('fetch batch of fills');

  if (fills.length === 0) {
    logger.info('no fills were found without prices');
    return;
  }

  const tokens = tokenCache.getTokens();

  const fillPrices = flow(
    map(fill => {
      const prices = getPrices(fill, tokens);
      return prices === null ? null : { fill, prices };
    }),
    compact,
  )(fills);

  if (fillPrices.length === 0) {
    logger.warn(`unable to derive prices for ${fillPrices.length} fills`);
    return;
  }

  const relayers = await Relayer.find();
  const relayerPrices = getRelayerPrices(fillPrices, relayers);
  const mapWithKey = map.convert({ cap: false });

  const relayerOperations = flow(
    mapWithKey((prices, lookupId) => ({
      updateOne: {
        filter: { lookupId: _.toNumber(lookupId) },
        update: {
          $set: flattenObject({
            prices,
          }),
        },
      },
    })),
    compact(),
  )(relayerPrices);

  const fillOperations = fillPrices.map(({ fill }) => ({
    updateOne: {
      filter: { _id: fill._id },
      update: {
        $set: {
          prices: {
            saved: true,
          },
        },
      },
    },
  }));

  await withTransaction(async session => {
    await Fill.bulkWrite(fillOperations, { session });

    // Set maker asset prices
    await Promise.all(
      fillPrices
        .filter(({ fill }) => fill.assets !== undefined)
        .map(async ({ fill, prices }) => {
          await Fill.updateOne(
            { _id: fill.id },
            {
              $set: {
                'assets.$[element].price': prices.maker,
              },
            },
            {
              arrayFilters: [
                {
                  'element.actor': FILL_ACTOR.MAKER,
                },
              ],
              session,
            },
          );
        }),
    );

    // Set taker asset prices
    await Promise.all(
      fillPrices
        .filter(({ fill }) => fill.assets !== undefined)
        .map(async ({ fill, prices }) => {
          await Fill.updateOne(
            { _id: fill.id },
            {
              $set: {
                'assets.$[element].price': prices.taker,
              },
            },
            {
              arrayFilters: [
                {
                  'element.actor': FILL_ACTOR.TAKER,
                },
              ],
              session,
            },
          );
        }),
    );

    if (relayerOperations.length > 0) {
      await Relayer.bulkWrite(relayerOperations, { session });
    }
  });

  logger.success(`derived prices of ${fillPrices.length} fills`);
};

module.exports = deriveFillPrices;
