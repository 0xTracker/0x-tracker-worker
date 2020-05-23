const _ = require('lodash');
const { getQueues } = require('../queues');
const bulkUpdateTokenMetadata = require('./bulk-update-token-metadata');
const convertProtocolFee = require('./convert-protocol-fee');
const fetchFillStatus = require('./fetch-fill-status');
const fetchTokenMetadata = require('./fetch-token-metadata');
const indexFill = require('./index-fill');
const indexFillProtocolFee = require('./index-fill-protocol-fee');
const indexFillStatus = require('./index-fill-status');
const indexFillValue = require('./index-fill-value');
const indexTradedTokens = require('./index-traded-tokens');

const consumers = [
  bulkUpdateTokenMetadata,
  convertProtocolFee,
  fetchFillStatus,
  fetchTokenMetadata,
  indexFill,
  indexFillProtocolFee,
  indexFillStatus,
  indexFillValue,
  indexTradedTokens,
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
