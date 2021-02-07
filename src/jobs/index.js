const _ = require('lodash');

const aggregateDailyNetworkMetrics = require('./aggregate-daily-network-metrics');
const aggregateDailyProtocolMetrics = require('./aggregate-daily-protocol-metrics');
const aggregateDailyTokenMetrics = require('./aggregate-daily-token-metrics');
const aggregateDailyTraderMetrics = require('./aggregate-daily-trader-metrics');
const batchScheduleFillCreation = require('./batch-schedule-fill-creation');
const batchScheduleTransactionFetch = require('./batch-schedule-transaction-fetch');
const createFills = require('./create-fills');
const deriveFillPrices = require('./derive-fill-prices');
const fetchArticles = require('./fetch-articles');
const getMissingTokenImages = require('./get-missing-token-images');
const measureFills = require('./measure-fills');

const jobFns = {
  aggregateDailyNetworkMetrics,
  aggregateDailyProtocolMetrics,
  aggregateDailyTokenMetrics,
  aggregateDailyTraderMetrics,
  batchScheduleFillCreation,
  batchScheduleTransactionFetch,
  createFills,
  deriveFillPrices,
  fetchArticles,
  getMissingTokenImages,
  measureFills,
};

const getJobs = ({ pollingIntervals }) =>
  _.map(jobFns, (fn, jobName) => ({
    fn,
    maxInterval: pollingIntervals.max[jobName] || pollingIntervals.max.default,
    minInterval: pollingIntervals.min[jobName] || pollingIntervals.min.default,
  }));

module.exports = { getJobs };
