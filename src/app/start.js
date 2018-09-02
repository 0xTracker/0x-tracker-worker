const config = require('config');

const { getJobs } = require('../jobs');
const { logError } = require('../util/error-logger');
const { runJobs } = require('../util/job-runner');

const start = async () => {
  const jobs = getJobs({
    maxRetries: config.get('maxRetries'),
    pollingIntervals: config.get('pollingIntervals'),
  });

  await runJobs(jobs, {
    onError: (retriesRemaining, error) => {
      logError(error);
    },
  });
};

module.exports = start;
