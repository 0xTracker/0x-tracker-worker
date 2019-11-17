const { getQueues } = require('../queues');
const { JOB, QUEUE } = require('../constants');
const fetchFillStatus = require('./fetch-fill-status');

const { FILL_PROCESSING } = QUEUE;
const { FETCH_FILL_STATUS } = JOB;

const initQueueConsumers = () => {
  const queues = getQueues();

  queues[FILL_PROCESSING].process(FETCH_FILL_STATUS, fetchFillStatus);
};

module.exports = { initQueueConsumers };
