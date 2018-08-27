const _ = require('lodash');

const createFills = require('./create-fills');
const getNewArticles = require('./get-new-articles');

const jobFns = {
  createFills,
  getNewArticles,
};

const getJobs = ({ maxRetries, pollingIntervals }) =>
  _.map(jobFns, (fn, jobName) => ({
    fn,
    interval: pollingIntervals[jobName] || pollingIntervals.default,
    maxRetries: maxRetries[jobName] || maxRetries.default,
  }));

module.exports = { getJobs };
