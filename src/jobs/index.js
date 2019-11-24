const _ = require('lodash');

// const backfillRelayerRelationships = require('./backfill-relayer-relationships');
const cacheAddressMetrics = require('./cache-address-metrics');
const cacheRelayerMetrics = require('./cache-relayer-metrics');
const cacheTokenMetrics = require('./cache-token-metrics');
const cacheTokenStats = require('./cache-token-stats');
const convertFees = require('./convert-fees');
const convertProtocolFees = require('./convert-protocol-fees');
const createFills = require('./create-fills');
const deriveFillPrices = require('./derive-fill-prices');
const getMissingTokenImages = require('./get-missing-token-images');
const getNewArticles = require('./get-new-articles');
const measureFills = require('./measure-fills');
const resolveTokens = require('./resolve-tokens');
const updateRelayerStats = require('./update-relayer-stats');

const jobFns = {
  // backfillRelayerRelationships,
  cacheAddressMetrics,
  cacheRelayerMetrics,
  cacheTokenMetrics,
  cacheTokenStats,
  convertFees,
  convertProtocolFees,
  createFills,
  deriveFillPrices,
  getMissingTokenImages,
  getNewArticles,
  measureFills,
  resolveTokens,
  updateRelayerStats,
};

const getJobs = ({ pollingIntervals }) =>
  _.map(jobFns, (fn, jobName) => ({
    fn,
    maxInterval: pollingIntervals.max[jobName] || pollingIntervals.max.default,
    minInterval: pollingIntervals.min[jobName] || pollingIntervals.min.default,
  }));

module.exports = { getJobs };
