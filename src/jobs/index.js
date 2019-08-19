const _ = require('lodash');

// const backfillRelayerRelationships = require('./backfill-relayer-relationships');
const cacheAddressMetrics = require('./cache-address-metrics');
const cacheRelayerMetrics = require('./cache-relayer-metrics');
const cacheTokenMetrics = require('./cache-token-metrics');
const cacheTokenStats = require('./cache-token-stats');
const convertFees = require('./convert-fees');
const createFills = require('./create-fills');
const deriveFillPrices = require('./derive-fill-prices');
const getMissingTokenImages = require('./get-missing-token-images');
const getNewArticles = require('./get-new-articles');
const measureFills = require('./measure-fills');
const resolveTokens = require('./resolve-tokens');
const updateFillStatuses = require('./update-fill-statuses');
const updateRelayerStats = require('./update-relayer-stats');

const jobFns = {
  // backfillRelayerRelationships,
  cacheAddressMetrics,
  cacheRelayerMetrics,
  cacheTokenMetrics,
  cacheTokenStats,
  convertFees,
  createFills,
  deriveFillPrices,
  getMissingTokenImages,
  getNewArticles,
  measureFills,
  resolveTokens,
  updateFillStatuses,
  updateRelayerStats,
};

const getJobs = ({ maxRetries, pollingIntervals }) =>
  _.map(jobFns, (fn, jobName) => ({
    fn,
    interval: pollingIntervals[jobName] || pollingIntervals.default,
    maxRetries: maxRetries[jobName] || maxRetries.default,
  }));

module.exports = { getJobs };
