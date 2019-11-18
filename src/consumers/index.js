const { getQueues } = require('../queues');
const { JOB, QUEUE } = require('../constants');
const fetchFillStatus = require('./fetch-fill-status');
const indexFill = require('./index-fill');

const initQueueConsumers = () => {
  const queues = getQueues();

  queues[QUEUE.FILL_PROCESSING].process(JOB.FETCH_FILL_STATUS, fetchFillStatus);
  queues[QUEUE.FILL_INDEXING].process(JOB.INDEX_FILL, indexFill);
};

module.exports = { initQueueConsumers };
