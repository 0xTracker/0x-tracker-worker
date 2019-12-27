const _ = require('lodash');
const { getQueues } = require('../queues');
const bulkIndexFills = require('./bulk-index-fills');
const fetchFillStatus = require('./fetch-fill-status');
const indexFill = require('./index-fill');
const indexFillStatus = require('./index-fill-status');
const indexFillValue = require('./index-fill-value');

const consumers = [
  bulkIndexFills,
  fetchFillStatus,
  indexFill,
  indexFillStatus,
  indexFillValue,
];

const initQueueConsumers = config => {
  const queues = getQueues();

  _.each(consumers, ({ fn, jobName, queueName }) => {
    const concurrency = _.get(config, `${fn.name}.concurrency`, null);

    if (concurrency === null) {
      queues[queueName].process(jobName, fn);
    } else {
      queues[queueName].process(jobName, concurrency, fn);
    }
  });
};

module.exports = { initQueueConsumers };
