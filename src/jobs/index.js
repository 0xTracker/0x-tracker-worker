const _ = require('lodash');

const aggregateDailyAppMetrics = require('./aggregate-daily-app-metrics');
const aggregateDailyLiquiditySourceMetrics = require('./aggregate-daily-liquidity-source-metrics');
const aggregateDailyNetworkMetrics = require('./aggregate-daily-network-metrics');
const aggregateDailyProtocolMetrics = require('./aggregate-daily-protocol-metrics');
const aggregateDailyTokenMetrics = require('./aggregate-daily-token-metrics');
const aggregateDailyTraderMetrics = require('./aggregate-daily-trader-metrics');
const batchScheduleFillCreation = require('./batch-schedule-fill-creation');
const batchScheduleTransactionFetch = require('./batch-schedule-transaction-fetch');
const deriveFillPrices = require('./derive-fill-prices');
const fetchArticles = require('./fetch-articles');
const getMissingTokenImages = require('./get-missing-token-images');
const precomputeAppStats = require('./precompute-app-stats');

const jobFns = {
  aggregateDailyAppMetrics,
  aggregateDailyLiquiditySourceMetrics,
  aggregateDailyNetworkMetrics,
  aggregateDailyProtocolMetrics,
  aggregateDailyTokenMetrics,
  aggregateDailyTraderMetrics,
  batchScheduleFillCreation,
  batchScheduleTransactionFetch,
  deriveFillPrices,
  fetchArticles,
  getMissingTokenImages,
  precomputeAppStats,
};

const getJobs = ({ pollingIntervals }) =>
  _.map(jobFns, (fn, jobName) => ({
    fn,
    maxInterval: pollingIntervals.max[jobName] || pollingIntervals.max.default,
    minInterval: pollingIntervals.min[jobName] || pollingIntervals.min.default,
  }));

module.exports = { getJobs };
