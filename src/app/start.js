const config = require('config');

const { getJobs } = require('../jobs');
const { logError } = require('../util/error-logger');
const { runJobs } = require('../util/job-runner');
const { initQueueConsumers } = require('../consumers');

const start = async () => {
  const jobs = getJobs({
    pollingIntervals: config.get('pollingIntervals'),
  });

  initQueueConsumers(config.get('consumers'));

  await runJobs(jobs, {
    onError: (retriesRemaining, error) => {
      logError(error);
    },
  });
};

module.exports = start;
