const _ = require('lodash');

const config = require('config');
const signale = require('signale');
const withRetry = require('promise-poller').default;

const logger = signale.scope('job runner');

const runJob = async ({ fn, interval, maxRetries }, options) => {
  const configKey = `jobs.${fn.name}`;
  const jobConfig = config.has(configKey)
    ? config.util.toObject(config.get(configKey))
    : {};

  try {
    await withRetry({
      taskFn: async () => {
        logger.time(`run ${fn.name} job`);
        await fn(jobConfig);
        logger.timeEnd(`run ${fn.name} job`);
      },
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
