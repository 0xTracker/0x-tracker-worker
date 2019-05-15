const _ = require('lodash');
const BigNumber = require('bignumber.js');

const getRelayersStats = require('./get-relayers-stats');

const getRelayerStats = async (dateFrom, dateTo) => {
  const relayerStats = await getRelayersStats(dateFrom, dateTo);
  const stats = _.reduce(
    relayerStats,
    (acc, stat) => ({
      fees: {
        USD: acc.fees.USD + stat.fees.USD,
        ZRX: acc.fees.ZRX.plus(stat.fees.ZRX.toString()),
      },
      trades: acc.trades + stat.trades,
      tradeVolume: acc.tradeVolume + stat.volume,
    }),
    {
      fees: { USD: 0, ZRX: new BigNumber(0) },
      trades: 0,
      tradeVolume: 0,
    },
  );

  return stats;
};

module.exports = getRelayerStats;
