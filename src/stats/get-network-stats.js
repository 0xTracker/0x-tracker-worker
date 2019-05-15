const _ = require('lodash');

const { ZRX_TOKEN_ADDRESS } = require('../constants');
const { getToken } = require('../tokens/token-cache');
const Fill = require('../model/fill');
const formatTokenAmount = require('../tokens/format-token-amount');

const getNetworkStats = async (dateFrom, dateTo) => {
  const metrics = await Fill.aggregate([
    {
      $match: {
        date: { $gte: new Date(dateFrom), $lte: new Date(dateTo) },
      },
    },
    {
      $group: {
        _id: null,
        localisedMakerFees: { $sum: `$conversions.USD.makerFee` },
        localisedTakerFees: { $sum: `$conversions.USD.takerFee` },
        fills: { $sum: 1 },
        makerFee: { $sum: '$makerFee' },
        takerFee: { $sum: '$takerFee' },
        volume: { $sum: `$conversions.USD.amount` },
      },
    },
  ]);

  const zrxToken = await getToken(ZRX_TOKEN_ADDRESS);
  const metric = metrics[0];

  return {
    fees: {
      USD:
        _.get(metric, 'localisedMakerFees', 0) +
        _.get(metric, 'localisedTakerFees', 0),
      ZRX: formatTokenAmount(
        _.get(metric, 'makerFee', 0) + _.get(metric, 'takerFee', 0),
        zrxToken,
      ),
    },
    fills: _.get(metric, 'fills', 0),
    volume: _.get(metric, 'volume', 0),
  };
};

module.exports = getNetworkStats;
