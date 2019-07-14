const _ = require('lodash');
const moment = require('moment');
const signale = require('signale');

const compute24HourTokenStats = require('../stats/compute-24-hour-token-stats');
const computeTokenStatsForDates = require('../stats/compute-token-stats-for-dates');
const Token = require('../model/token');

const logger = signale.scope('cache token stats');

const persistTokenStatsForPeriod = async (period, tokenStats) => {
  logger.time(`persist ${period} token stats`);

  const tokensWithStats = tokenStats.map(stat => stat.tokenAddress);
  const totalVolume = _.sumBy(tokenStats, 'usdVolume');

  const updateOperations = tokenStats
    .map(stat => ({
      updateOne: {
        filter: { address: stat.tokenAddress },
        update: {
          $set: {
            [`stats.${period}`]: {
              fillCount: stat.fillCount,
              volume: {
                token: stat.tokenVolume,
                USD: stat.usdVolume,
              },
              volumeShare:
                totalVolume === 0 ? 0 : (stat.usdVolume / totalVolume) * 100,
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

  logger.timeEnd(`persist ${period} token stats`);
};

const cacheTokenStats = async () => {
  await Promise.all([
    (async () => {
      logger.time('compute 24h token stats');
      const stats = await compute24HourTokenStats();
      logger.timeEnd('compute 24h token stats');

      await persistTokenStatsForPeriod('24h', stats);
    })(),
    (async () => {
      const dateTo = moment.utc();
      const dateFrom = moment.utc(dateTo).subtract(7, 'days');

      logger.time('compute 7d token stats');
      const stats = await computeTokenStatsForDates(dateFrom, dateTo);
      logger.timeEnd('compute 7d token stats');

      await persistTokenStatsForPeriod('7d', stats);
    })(),
    (async () => {
      const dateTo = moment.utc();
      const dateFrom = moment.utc(dateTo).subtract(1, 'months');

      logger.time('compute 1m token stats');
      const stats = await computeTokenStatsForDates(dateFrom, dateTo);
      logger.timeEnd('compute 1m token stats');

      await persistTokenStatsForPeriod('1m', stats);
    })(),
  ]);
};

module.exports = cacheTokenStats;
