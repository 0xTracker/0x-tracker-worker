const _ = require('lodash');
const signale = require('signale');

const { getQueues } = require('../queues');
const bulkUpdateTokenMetadata = require('./bulk-update-token-metadata');
const convertProtocolFee = require('./convert-protocol-fee');
const convertRelayerFees = require('./convert-relayer-fees');
const createToken = require('./create-token');
const createTransformedERC20EventFills = require('./create-transformed-erc20-event-fills');
const fetchAddressType = require('./fetch-address-type');
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
  createToken,
  createTransformedERC20EventFills,
  fetchAddressType,
  fetchTokenMetadata,
  fetchTransaction,
  indexAppFillAttributions,
  indexFill,
  indexFillProtocolFee,
  indexFillTraders,
  indexFillValue,
  indexTradedTokens,
];

const initQueueConsumers = config => {
  const queues = getQueues();

  _.each(consumers, ({ fn, jobName, queueName }) => {
    const concurrency = _.get(config, `${fn.name}.concurrency`, null);
    const jobLogger = signale.scope(`job-consumer/${_.kebabCase(jobName)}`);
    const fnWrapper = job => fn(job, { logger: jobLogger });

    if (concurrency === null) {
      queues[queueName].process(jobName, fnWrapper);
    } else {
      queues[queueName].process(jobName, concurrency, fnWrapper);
    }
  });
};

module.exports = { initQueueConsumers };
