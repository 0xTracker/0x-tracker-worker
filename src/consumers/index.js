const _ = require('lodash');
const signale = require('signale');

const { getQueues } = require('../queues');
const bulkUpdateTokenMetadata = require('./bulk-update-token-metadata');
const convertProtocolFee = require('./convert-protocol-fee');
const convertRelayerFees = require('./convert-relayer-fees');
const createFillsForEvent = require('./create-fills-for-event');
const createLiquidityProviderSwapEventFill = require('./create-liquidity-provider-swap-event-fill');
const createSushiswapSwapEventFill = require('./create-sushiswap-swap-event-fill');
const createToken = require('./create-token');
const createTransformedERC20EventFills = require('./create-transformed-erc20-event-fills');
const createUniswapV2SwapEventFill = require('./create-uniswap-v2-swap-event-fill');
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
  createLiquidityProviderSwapEventFill,
  createSushiswapSwapEventFill,
  createToken,
  createTransformedERC20EventFills,
  createUniswapV2SwapEventFill,
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
