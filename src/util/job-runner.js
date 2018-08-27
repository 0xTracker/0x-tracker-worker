const _ = require('lodash');
const withRetry = require('promise-poller').default;

const runJob = async ({ fn, interval, maxRetries }, options) => {
  try {
    await withRetry({
      taskFn: fn,
      interval,
      retries: maxRetries,
      progressCallback: options.onError,
      shouldContinue: () => true,
    });
  } catch (error) {
    if (_.isArray(error)) {
      throw new Error(
        `Stopped running ${fn.name} due to too many failures (${maxRetries}).`,
      );
    } else {
      throw error;
    }
  }
};

const runJobs = (jobs, options) =>
  Promise.all(jobs.map(job => runJob(job, options)));

module.exports.runJobs = runJobs;
