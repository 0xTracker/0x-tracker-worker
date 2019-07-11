const _ = require('lodash');

const cacheStats = require('./cache-stats');
const cacheTokenMetrics = require('./cache-token-metrics');
const createFills = require('./create-fills');
const getMissingTokenImages = require('./get-missing-token-images');
const getNewArticles = require('./get-new-articles');
const resolveTokens = require('./resolve-tokens');
const setRelayerForFills = require('./set-relayer-for-fills');
const updateFillPrices = require('./update-fill-prices');
const updateFillRates = require('./update-fill-rates');
const updateFillStatuses = require('./update-fill-statuses');
const updateRelayerMetrics = require('./update-relayer-metrics');
const updateRelayerStats = require('./update-relayer-stats');
const updateTokenPrices = require('./update-token-prices');
const updateTokenStats = require('./update-token-stats');

const jobFns = {
  cacheTokenMetrics,
  cacheStats,
  createFills,
  getMissingTokenImages,
  getNewArticles,
  resolveTokens,
  setRelayerForFills,
  updateFillPrices,
  updateFillRates,
  updateFillStatuses,
  updateRelayerMetrics,
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
