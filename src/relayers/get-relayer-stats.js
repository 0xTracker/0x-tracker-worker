const _ = require('lodash');

const { ZRX_TOKEN_ADDRESS } = require('../constants');
const { getToken } = require('../tokens/token-cache');
const { getModel } = require('../model');
const formatTokenAmount = require('../tokens/format-token-amount');
const getAllRelayers = require('../relayers/get-all-relayers');

const getRelayerStats = async (dateFrom, dateTo) => {
  const metrics = await getModel('Fill').aggregate([
    {
      $match: {
        date: { $gte: new Date(dateFrom), $lte: new Date(dateTo) },
        relayerId: { $ne: null },
      },
    },
    {
      $group: {
        _id: {
          relayerId: `$relayerId`,
        },
        localisedMakerFees: { $sum: `$conversions.USD.makerFee` },
        localisedTakerFees: { $sum: `$conversions.USD.takerFee` },
        makerFee: { $sum: '$makerFee' },
        takerFee: { $sum: '$takerFee' },
        trades: { $sum: 1 },
        volume: { $sum: `$conversions.USD.amount` },
      },
    },
  ]);

  const relayers = getAllRelayers();
  const zrxToken = getToken(ZRX_TOKEN_ADDRESS);

  const stats = _.map(relayers, relayer => {
    const metric = _.find(metrics, { _id: { relayerId: relayer.lookupId } });

    if (_.isUndefined(metric)) {
      return {
        fees: { USD: 0, ZRX: 0 },
        relayerId: relayer.lookupId,
        trades: 0,
        volume: 0,
      };
    }

    const {
      localisedMakerFees,
      localisedTakerFees,
      makerFee,
      takerFee,
      trades,
      volume,
    } = metric;

    const stat = {
      fees: {
        USD: localisedMakerFees + localisedTakerFees,
        ZRX: formatTokenAmount(makerFee + takerFee, zrxToken),
      },
      relayerId: relayer.lookupId,
      trades,
      volume,
    };

    if (relayer.orderMatcher) {
      return {
        fees: stat.fees,
        relayerId: relayer.lookupId,
        trades: Math.ceil(stat.trades / 2),
        volume: stat.volume / 2,
      };
    }

    return stat;
  });

  return stats;
};

module.exports = getRelayerStats;
