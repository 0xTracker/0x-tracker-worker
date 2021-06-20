const _ = require('lodash');
const signale = require('signale');

const { getQueues } = require('../queues');
const convertProtocolFee = require('./convert-protocol-fee');
const convertRelayerFees = require('./convert-relayer-fees');
const createFillsForEvent = require('./create-fills-for-event');
const fetchAddressType = require('./fetch-address-type');
const fetchTokenMetadata = require('./fetch-token-metadata');
const fetchTransaction = require('./fetch-transaction');
const indexFill = require('./index-fill');
const indexFillProtocolFee = require('./index-fill-protocol-fee');
const indexFillTraders = require('./index-fill-traders');
const indexFillValue = require('./index-fill-value');
const indexTradedTokens = require('./index-traded-tokens');
const measureFill = require('./measure-fill');

const consumers = [
  convertProtocolFee,
  convertRelayerFees,
  createFillsForEvent,
  fetchAddressType,
  fetchTokenMetadata,
  fetchTransaction,
  indexFill,
  indexFillProtocolFee,
  indexFillTraders,
  indexFillValue,
  indexTradedTokens,
  measureFill,
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
