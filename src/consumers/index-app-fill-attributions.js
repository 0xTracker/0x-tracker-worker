const { JOB, QUEUE } = require('../constants');

// TODO: Remove once queue has been drained
const consumer = async () => {};

module.exports = {
  fn: consumer,
  jobName: JOB.INDEX_APP_FILL_ATTRIBUTONS,
  queueName: QUEUE.INDEXING,
};
