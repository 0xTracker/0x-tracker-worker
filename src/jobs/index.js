const _ = require('lodash');

const backfillRelayerMetrics = require('./backfill-relayer-metrics');
const cacheStats = require('./cache-stats');
const createFills = require('./create-fills');
const getMissingTokenImages = require('./get-missing-token-images');
const getMissingTokens = require('./get-missing-tokens');
const getNewArticles = require('./get-new-articles');
const setRelayerForFills = require('./set-relayer-for-fills');
const updateFillPrices = require('./update-fill-prices');
const updateFillRates = require('./update-fill-rates');
const updateFillStatuses = require('./update-fill-statuses');
const updateRelayerStats = require('./update-relayer-stats');
const updateTokenPrices = require('./update-token-prices');
const updateTokenStats = require('./update-token-stats');

const jobFns = {
  backfillRelayerMetrics,
  cacheStats,
  createFills,
  getMissingTokenImages,
  getMissingTokens,
  getNewArticles,
  setRelayerForFills,
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
