const _ = require('lodash');

const config = require('config');
const signale = require('signale');
const withRetry = require('promise-poller').default;

const logger = signale.scope('job runner');

const runJob = async ({ fn, maxInterval, minInterval }, options) => {
  const configKey = `jobs.${fn.name}`;
  const jobConfig = config.has(configKey)
    ? config.util.toObject(config.get(configKey))
    : {};

  try {
    await withRetry({
      max: maxInterval,
      min: minInterval,
      progressCallback: options.onError,
      retries: 999999, // Setting a large number because poller does not work properly with Infinity
      shouldContinue: () => true,
      strategy: 'exponential-backoff',
      taskFn: async () => {
        logger.time(`run ${fn.name} job`);
        await fn(jobConfig);
        logger.timeEnd(`run ${fn.name} job`);
      },
    });
  } catch (error) {
    if (_.isArray(error)) {
      throw new Error(`Stopped running ${fn.name}.`);
    } else {
      throw error;
    }
  }
};

const runJobs = (jobs, options) =>
  Promise.all(jobs.map(job => runJob(job, options)));

module.exports.runJobs = runJobs;
