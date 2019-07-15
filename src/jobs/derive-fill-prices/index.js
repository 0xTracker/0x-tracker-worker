const _ = require('lodash');
const { compact, flow, map } = require('lodash/fp');
const flattenObject = require('flat');
const signale = require('signale');

const Fill = require('../../model/fill');
const getPrices = require('./get-prices-for-fill');
const getRelayerPrices = require('./get-relayer-prices');
const Relayer = require('../../model/relayer');
const tokenCache = require('../../tokens/token-cache');
const withTransaction = require('../../util/with-transaction');

const logger = signale.scope('derive fill prices');

const deriveFillPrices = async ({ batchSize }) => {
  const fills = await Fill.find(
    {
      // Determine whether prices can be derived
      'conversions.USD.amount': { $ne: null },
      'tokenSaved.maker': true,
      'tokenSaved.taker': true,

      // Determine whether prices have already been derived
      'prices.saved': { $in: [null, false] },
    },
    '_id conversions date makerAmount makerToken relayerId takerAmount takerToken',
  ).limit(batchSize);

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

  const fillOperations = fillPrices.map(({ fill, prices }) => ({
    updateOne: {
      filter: { _id: fill._id },
      update: {
        $set: {
          'conversions.USD.makerPrice': prices.maker.localised.USD,
          'conversions.USD.takerPrice': prices.taker.localised.USD,
          prices: {
            maker: prices.maker.token.toNumber(),
            taker: prices.taker.token.toNumber(),
            saved: true,
          },
        },
      },
    },
  }));

  await withTransaction(async session => {
    await Fill.bulkWrite(fillOperations, { session });

    if (relayerOperations.length > 0) {
      await Relayer.bulkWrite(relayerOperations, { session });
    }
  });

  logger.success(`derived prices of ${fillPrices.length} fills`);
};

module.exports = deriveFillPrices;
