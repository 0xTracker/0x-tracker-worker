const _ = require('lodash');
const moment = require('moment');
const signale = require('signale');

const getTokenStats = require('../tokens/get-token-stats.js');
const Token = require('../model/token');

const logger = signale.scope('update token prices');

const updateTokenStatsForPeriod = async (period, dateFrom) => {
  logger.time(`update ${period} token stats`);

  const tokenStats = await getTokenStats(dateFrom, new Date());
  const tokensWithStats = tokenStats.map(stat => stat.token);
  const totalVolume = _.sumBy(tokenStats, 'volume.USD');

  const updateOperations = tokenStats
    .map(stat => ({
      updateOne: {
        filter: { address: stat.token },
        update: {
          $set: {
            [`stats.${period}`]: {
              trades: stat.trades,
              volume: stat.volume,
              volumeShare:
                totalVolume === 0 ? 0 : (stat.volume.USD / totalVolume) * 100,
            },
          },
        },
      },
    }))
    .concat({
      updateMany: {
        filter: { address: { $nin: tokensWithStats } },
        update: {
          $set: {
            [`stats.${period}`]: {},
          },
        },
      },
    });

  await Token.collection.bulkWrite(updateOperations);

  logger.timeEnd(`update ${period} token stats`);
};

const updateTokenStats = async () => {
  Promise.all([
    updateTokenStatsForPeriod(
      '24h',
      moment()
        .subtract(1, 'days')
        .toDate(),
    ),
    updateTokenStatsForPeriod(
      '7d',
      moment()
        .subtract(7, 'days')
        .toDate(),
    ),
    updateTokenStatsForPeriod(
      '1m',
      moment()
        .subtract(1, 'months')
        .toDate(),
    ),
  ]);
};

module.exports = updateTokenStats;
