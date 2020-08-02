const _ = require('lodash');
const { getQueues } = require('../queues');
const bulkUpdateTokenMetadata = require('./bulk-update-token-metadata');
const convertProtocolFee = require('./convert-protocol-fee');
const convertRelayerFees = require('./convert-relayer-fees');
const createToken = require('./create-token');
const fetchTokenMetadata = require('./fetch-token-metadata');
const fetchTransaction = require('./fetch-transaction');
const indexAppFillAttributions = require('./index-app-fill-attributions');
const indexFill = require('./index-fill');
const indexFillProtocolFee = require('./index-fill-protocol-fee');
const indexFillValue = require('./index-fill-value');
const indexTradedTokens = require('./index-traded-tokens');

const consumers = [
  bulkUpdateTokenMetadata,
  convertProtocolFee,
  convertRelayerFees,
  createToken,
  fetchTokenMetadata,
  fetchTransaction,
  indexAppFillAttributions,
  indexFill,
  indexFillProtocolFee,
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
