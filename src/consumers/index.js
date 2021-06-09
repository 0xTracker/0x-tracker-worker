const _ = require('lodash');
const signale = require('signale');

const { getQueues } = require('../queues');
const bulkUpdateTokenMetadata = require('./bulk-update-token-metadata');
const convertProtocolFee = require('./convert-protocol-fee');
const convertRelayerFees = require('./convert-relayer-fees');
const createFillsForEvent = require('./create-fills-for-event');
const createToken = require('./create-token');
const fetchAddressType = require('./fetch-address-type');
const fetchFillStatus = require('./fetch-fill-status');
const fetchTokenMetadata = require('./fetch-token-metadata');
const fetchTransaction = require('./fetch-transaction');
const indexAppFillAttributions = require('./index-app-fill-attributions');
const indexFill = require('./index-fill');
const indexFillProtocolFee = require('./index-fill-protocol-fee');
const indexFillTraders = require('./index-fill-traders');
const indexFillValue = require('./index-fill-value');
const indexTradedTokens = require('./index-traded-tokens');

const consumers = [
  bulkUpdateTokenMetadata,
  convertProtocolFee,
  convertRelayerFees,
  createFillsForEvent,
  createToken,
  fetchAddressType,
  fetchFillStatus,
  fetchTokenMetadata,
  fetchTransaction,
  indexAppFillAttributions,
  indexFill,
  indexFillProtocolFee,
  indexFillTraders,
  indexFillValue,
  indexTradedTokens,
];

const initQueueConsumers = () => {
  const queues = getQueues();

  _.each(consumers, ({ fn, jobName, queueName }) => {
    const jobLogger = signale.scope(`job-consumer/${_.kebabCase(jobName)}`);
    const fnWrapper = job => fn(job, { logger: jobLogger });

    queues[queueName].process(jobName, 1, fnWrapper);
  });
};

module.exports = { initQueueConsumers };
