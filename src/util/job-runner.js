const _ = require('lodash');

const config = require('config');
const signale = require('signale');
const withRetry = require('promise-poller').default;

const runJob = async ({ fn, maxInterval, minInterval }, options) => {
  const jobName = fn.name;
  const configKey = `jobs.${jobName}`;
  const jobConfig = config.has(configKey)
    ? config.util.toObject(config.get(configKey))
    : {};

  const jobLogger = signale.scope(`job-runner/${_.kebabCase(jobName)}`);

  try {
    await withRetry({
      max: maxInterval,
      min: minInterval,
      progressCallback: options.onError,
      retries: 999999, // Setting a large number because poller does not work properly with Infinity
      shouldContinue: () => true,
      strategy: 'exponential-backoff',
      taskFn: async () => {
        const start = new Date();
        jobLogger.info(`starting ${jobName} job run`);
        await fn(jobConfig, { logger: jobLogger });
        jobLogger.info(
          `finished ${jobName} job run after ${new Date() - start}ms`,
        );
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
