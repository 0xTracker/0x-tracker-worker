const _ = require('lodash');

const backfillRelayerRelationships = require('./backfill-relayer-relationships');
const cacheRelayerMetrics = require('./cache-relayer-metrics');
const cacheStats = require('./cache-stats');
const cacheTokenMetrics = require('./cache-token-metrics');
const createFills = require('./create-fills');
const getMissingTokenImages = require('./get-missing-token-images');
const getNewArticles = require('./get-new-articles');
const resolveTokens = require('./resolve-tokens');
const updateFillPrices = require('./update-fill-prices');
const updateFillRates = require('./update-fill-rates');
const updateFillStatuses = require('./update-fill-statuses');
const updateRelayerStats = require('./update-relayer-stats');
const updateTokenPrices = require('./update-token-prices');
const updateTokenStats = require('./update-token-stats');

const jobFns = {
  backfillRelayerRelationships,
  cacheRelayerMetrics,
  cacheStats,
  cacheTokenMetrics,
  createFills,
  getMissingTokenImages,
  getNewArticles,
  resolveTokens,
  updateFillPrices,
  updateFillRates,
  updateFillStatuses,
  updateRelayerStats,
  updateTokenPrices,
  updateTokenStats,
};

const getJobs = ({ maxRetries, pollingIntervals }) =>
  _.map(jobFns, (fn, jobName) => ({
    fn,
    interval: pollingIntervals[jobName] || pollingIntervals.default,
    maxRetries: maxRetries[jobName] || maxRetries.default,
  }));

module.exports = { getJobs };
