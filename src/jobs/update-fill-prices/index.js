const _ = require('lodash');
const { compact, flow, map } = require('lodash/fp');
const flattenObject = require('flat');
const signale = require('signale');

const Fill = require('../../model/fill');
const getPrices = require('./get-prices-for-fill');
const getRelayerPrices = require('./get-relayer-prices');
const Relayer = require('../../model/relayer');
const tokenCache = require('../../tokens/token-cache');

const logger = signale.scope('update fill prices');

const updateFillPrices = async ({ batchSize }) => {
  const fills = await Fill.find(
    {
      'rates.saved': true,
      'tokenSaved.maker': true,
      'tokenSaved.taker': true,
      'prices.saved': { $in: [null, false] },
    },
    '_id conversions date makerAmount makerToken relayerId takerAmount takerToken',
  )
    .sort({ date: -1 })
    .limit(batchSize);

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
    logger.warn(`unable to generate prices for ${fillPrices.length} fills`);
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

  // TODO: Investigate using the new MongoDB transactions feature to ensure consistency
  await Fill.bulkWrite(fillOperations);

  if (relayerOperations.length > 0) {
    await Relayer.bulkWrite(relayerOperations);
  }

  logger.success(`updated prices for ${fillPrices.length} fills`);
};

module.exports = updateFillPrices;
