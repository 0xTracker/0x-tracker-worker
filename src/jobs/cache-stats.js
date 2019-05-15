const moment = require('moment');
const signale = require('signale');

const CacheEntry = require('../model/cache-entry');
const getNetworkStats = require('../stats/get-network-stats');
const getRelayerStats = require('../stats/get-relayer-stats');

const logger = signale.scope('cache stats');

const cacheStats = async () => {
  const dateFrom = moment()
    .subtract(1, 'days')
    .toDate();

  const dateTo = moment().toDate();

  logger.time('compute network stats');
  const networkStats = await getNetworkStats(dateFrom, dateTo);
  logger.timeEnd('compute network stats');

  await CacheEntry.updateOne(
    { key: 'networkStats.24h' },
    { $set: { data: networkStats, key: 'networkStats.24h' } },
    { upsert: true },
  );

  logger.success('cached 24h network stats');

  logger.time('compute relayer stats');
  const relayerStats = await getRelayerStats(dateFrom, dateTo);
  logger.timeEnd('compute relayer stats');

  await CacheEntry.updateOne(
    { key: 'relayerStats.24h' },
    { $set: { data: relayerStats } },
    { upsert: true },
  );

  logger.success('cached 24h relayer stats');
};

module.exports = cacheStats;
