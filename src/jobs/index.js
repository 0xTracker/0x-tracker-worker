const _ = require('lodash');

const cacheAddressMetrics = require('./cache-address-metrics');
// const convertFees = require('./convert-fees');
const createFills = require('./create-fills');
const deriveFillPrices = require('./derive-fill-prices');
const fetchArticles = require('./fetch-articles');
const getMissingTokenImages = require('./get-missing-token-images');
const measureFills = require('./measure-fills');

const jobFns = {
  cacheAddressMetrics,
  // convertFees,
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
