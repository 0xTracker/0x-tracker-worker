const _ = require('lodash');
const ms = require('ms');
const Queue = require('bull');

const { logError } = require('./util/error-logger');

const queues = {};

const getQueue = queueName => {
  if (queues[queueName] === undefined) {
    throw new Error(
      `No queue has been initialized with the name: ${queueName}`,
    );
  }
  return queues[queueName];
};

const getQueues = () => {
  return queues;
};

const initQueues = (queueNames, config) => {
  queueNames.forEach(queueName => {
    const queueConfig = _.get(config, _.camelCase(queueName), {});

    queues[queueName] = new Queue(queueName, {
      defaultJobOptions: {
        attempts: 10,
        backoff: { delay: ms('10 seconds'), type: 'exponential' },
        lifo: true,
        removeOnComplete: 1000,
        timeout: 10000,
      },
      redis: {
        host: process.env.REDIS_URL,
      },
      ...queueConfig,
    })
      .on('error', logError)
      .on('failed', (job, error) => {
        logError(error, {
          job: _.pick(job, 'id', 'data', 'opts', 'attemptsMade', 'name'),
        });
      });
  });
};

const publishJob = async (queueName, jobName, jobData, options = {}) => {
  const queue = getQueue(queueName);

  await queue.add(jobName, jobData, options);
};

module.exports = { getQueue, getQueues, initQueues, publishJob };
