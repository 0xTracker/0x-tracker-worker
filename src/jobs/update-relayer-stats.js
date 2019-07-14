const _ = require('lodash');
const moment = require('moment');
const signale = require('signale');

const getRelayerStats = require('../relayers/get-relayer-stats.js');
const Relayer = require('../model/relayer');

const logger = signale.scope('update relayer stats');

const updateRelayerStatsForPeriod = async (period, dateFrom) => {
  logger.time(`update ${period} relayer stats`);

  const relayerStats = await getRelayerStats(dateFrom, new Date());
  const relayersWithStats = relayerStats.map(stat => stat.relayerId);
  const totalVolume = _.sumBy(relayerStats, 'volume');

  const updateOperations = relayerStats
    .map(stat => ({
      updateOne: {
        filter: { lookupId: stat.relayerId },
        update: {
          $set: {
            [`stats.${period}`]: {
              fees: { USD: stat.fees.USD, ZRX: stat.fees.ZRX.toString() },
              trades: stat.trades,
              volume: stat.volume,
              volumeShare:
                totalVolume === 0 ? 0 : (stat.volume / totalVolume) * 100,
            },
          },
        },
      },
    }))
    .concat({
      updateMany: {
        filter: { lookupId: { $nin: relayersWithStats } },
        update: {
          $set: {
            [`stats.${period}`]: {},
          },
        },
      },
    });

  await Relayer.collection.bulkWrite(updateOperations);

  logger.timeEnd(`update ${period} relayer stats`);
};

const updateRelayerStats = async () => {
  await Promise.all([
    updateRelayerStatsForPeriod(
      '24h',
      moment()
        .subtract(1, 'days')
        .toDate(),
    ),
    updateRelayerStatsForPeriod(
      '7d',
      moment()
        .subtract(7, 'days')
        .toDate(),
    ),
    updateRelayerStatsForPeriod(
      '1m',
      moment()
        .subtract(1, 'months')
        .toDate(),
    ),
  ]);
};

module.exports = updateRelayerStats;
