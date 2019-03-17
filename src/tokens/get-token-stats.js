const _ = require('lodash');
const { BigNumber } = require('@0xproject/utils');

const Fill = require('../model/fill');
const getAllRelayers = require('../relayers/get-all-relayers');
const getTokensByAddresses = require('../tokens/get-tokens-by-addresses');

const reduceStats = stats =>
  stats.reduce(
    (acc, stat) => ({
      tokenVolume: acc.tokenVolume.plus(stat.tokenVolume.toString()),
      tradeCount: acc.tradeCount + stat.tradeCount,
      volume: acc.volume + stat.volume,
    }),
    {
      tokenVolume: new BigNumber(0),
      tradeCount: 0,
      volume: 0,
    },
  );

const getTokenStatsForMatch = async (match, halveStats = false) => {
  const results = await Fill.aggregate([
    {
      $match: match,
    },
    {
      $group: {
        _id: {
          makerToken: '$makerToken',
          takerToken: '$takerToken',
        },
        localisedAmount: { $sum: `$conversions.USD.amount` },
        makerAmount: { $sum: '$makerAmount' },
        takerAmount: { $sum: '$takerAmount' },
        tradeCount: { $sum: 1 },
      },
    },
  ]);

  const divisor = halveStats ? 2 : 1;

  const reduced = _(results)
    .map(result => [
      {
        token: result._id.makerToken,
        tokenVolume: result.makerAmount / divisor,
        tradeCount: result.tradeCount / divisor,
        volume: result.localisedAmount / divisor,
      },
      {
        token: result._id.takerToken,
        tokenVolume: result.takerAmount / divisor,
        tradeCount: result.tradeCount / divisor,
        volume: result.localisedAmount / divisor,
      },
    ])
    .flatten()
    .groupBy('token')
    .mapValues(reduceStats)
    .value();

  return reduced;
};

const getTokenStats = async (dateFrom, dateTo) => {
  const orderMatchingRelayerIds = Object.values(getAllRelayers())
    .filter(relayer => relayer.orderMatcher)
    .map(relayer => relayer.lookupId);

  const baseQuery = {
    date: { $gte: dateFrom, $lte: dateTo },
  };

  const regularStats = await getTokenStatsForMatch({
    ...baseQuery,
    $and: [
      { relayerId: { $nin: orderMatchingRelayerIds } },
      { relayerId: { $ne: null } },
    ],
  });

  const orderMatcherStats = await getTokenStatsForMatch(
    {
      ...baseQuery,
      relayerId: { $in: orderMatchingRelayerIds },
    },
    true,
  );

  const stats = _.mergeWith(
    {},
    regularStats,
    orderMatcherStats,
    (objValue, srcValue) =>
      _.isPlainObject(objValue) ? reduceStats([objValue, srcValue]) : srcValue,
  );

  const tokenAddresses = _.keys(stats);
  const tokens = await getTokensByAddresses(tokenAddresses);

  return _.map(tokens, token => {
    const statsForToken = stats[token.address];

    return {
      token: token.address,
      trades: Math.ceil(statsForToken.tradeCount),
      volume: {
        token: Math.ceil(statsForToken.tokenVolume),
        USD: statsForToken.volume,
      },
    };
  });
};

module.exports = getTokenStats;
