const ms = require('ms');
const Queue = require('bull');

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

const initQueues = queueNames => {
  queueNames.forEach(queueName => {
    queues[queueName] = new Queue(queueName, {
      limiter: {
        max: 1, // Max number of jobs processed
        duration: 100, // per duration in milliseconds
      },
      redis: {
        host: process.env.REDIS_URL,
      },
    });
  });
};

const publishJob = (queueName, jobName, jobData, options = {}) => {
  const defaultOptions = {
    attempts: 999,
    backoff: {
      delay: ms('10 seconds'),
      type: 'exponential',
    },
  };
  const queue = getQueue(queueName);

  queue.add(jobName, jobData, { ...defaultOptions, ...options });
};

module.exports = { getQueue, getQueues, initQueues, publishJob };
