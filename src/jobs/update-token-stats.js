const moment = require('moment');
const signale = require('signale');

const getTokenStats = require('../tokens/get-token-stats.js');
const Token = require('../model/token');

const logger = signale.scope('update token prices');

const updateTokenStats = async () => {
  const tokenStats = await getTokenStats(
    moment()
      .subtract(1, 'days')
      .toDate(),
    new Date(),
  );

  const tokensWithStats = tokenStats.map(stat => stat.token);

  const updateOperations = tokenStats
    .map(stat => ({
      updateOne: {
        filter: { address: stat.token },
        update: {
          $set: {
            stats: {
              '24h': {
                trades: stat.trades,
                volume: stat.volume,
              },
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
            stats: {
              '24h': {},
            },
          },
        },
      },
    });

  await Token.collection.bulkWrite(updateOperations);

  logger.success('updated token stats');
};

module.exports = updateTokenStats;
