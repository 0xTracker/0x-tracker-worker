const _ = require('lodash');

const createFills = require('./create-fills');
const getMissingTokens = require('./get-missing-tokens');
const getNewArticles = require('./get-new-articles');
const setRelayerForFills = require('./set-relayer-for-fills');
const updateFillStatuses = require('./update-fill-statuses');

const jobFns = {
  createFills,
  getMissingTokens,
  getNewArticles,
  setRelayerForFills,
  updateFillStatuses,
};

const getJobs = ({ maxRetries, pollingIntervals }) =>
  _.map(jobFns, (fn, jobName) => ({
    fn,
    interval: pollingIntervals[jobName] || pollingIntervals.default,
    maxRetries: maxRetries[jobName] || maxRetries.default,
  }));

module.exports = { getJobs };
