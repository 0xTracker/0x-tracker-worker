const { QUEUE } = require('../constants');

// TODO: Remove once queue has been drained
const consumer = async () => {};

module.exports = {
  fn: consumer,
  jobName: 'index-app-fill-attributions',
  queueName: QUEUE.INDEXING,
};
