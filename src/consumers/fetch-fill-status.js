const { QUEUE } = require('../constants');

const consumer = async () => {
  // Do nothing, just need to empty the queue
};

module.exports = {
  fn: consumer,
  jobName: 'fetch-fill-status',
  queueName: QUEUE.FILL_PROCESSING,
};
