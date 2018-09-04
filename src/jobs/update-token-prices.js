const _ = require('lodash');
const { flattenDepth, flow, map, reduce, sortBy } = require('lodash/fp');
const Immutable = require('seamless-immutable').static;
const signale = require('signale');

const Relayer = require('../model/relayer');
const Token = require('../model/token');

const mapWithKey = map.convert({ cap: false });
const logger = signale.scope('update token prices');

const updateTokenPrices = async () => {
  const relayers = await Relayer.find();
  const updateOperations = flow(
    map(relayer =>
      _.map(relayer.prices, ({ lastPrice, lastTrade }, tokenAddress) => ({
        tokenAddress,
        lastTrade,
        lastPrice,
      })),
    ),
    flattenDepth(2),
    sortBy('lastTrade.date'),
    reduce(
      (acc, { tokenAddress, lastTrade, lastPrice }) =>
        Immutable.merge(
          acc,
          {
            [tokenAddress]: {
              lastTrade,
              lastPrice,
            },
          },
          { deep: true },
        ),
      {},
    ),
    mapWithKey((price, address) => ({
      updateOne: {
        filter: { address },
        update: {
          $set: { price },
        },
      },
    })),
  )(relayers);

  if (updateOperations.length === 0) {
    logger.warn(`no token prices were updated`);
    return;
  }

  await Token.collection.bulkWrite(updateOperations);

  logger.success(`updated prices of ${updateOperations.length} tokens`);
};

module.exports = updateTokenPrices;
