const _ = require('lodash');
const signale = require('signale');

const { JOB, QUEUE } = require('../../constants');
const buildTransaction = require('./build-transaction');
const checkTransactionExists = require('../../transactions/check-transaction-exists');
const getBlock = require('../../util/ethereum/get-block');
const getERC20BridgeTransferEvents = require('../../transactions/get-erc20-bridge-transfer-events');
const getTransaction = require('../../util/ethereum/get-transaction');
const getTransactionReceipt = require('../../util/ethereum/get-transaction-receipt');
const persistEvents = require('../../events/persist-events');
const persistTransaction = require('./persist-transaction');
const withTransaction = require('../../util/with-transaction');

const logger = signale.scope('fetch transaction');

const fetchTransaction = async job => {
  const { blockNumber, transactionHash } = job.data;

  logger.info(`fetching transaction: ${transactionHash}`);

  if (_.isEmpty(transactionHash)) {
    throw new Error(`Invalid transactionHash: ${transactionHash}`);
  }

  const existsAlready = await checkTransactionExists(transactionHash);

  if (existsAlready) {
    logger.warn(`transaction has already been fetched: ${transactionHash}`);
    return;
  }

  const [tx, receipt, block] = await Promise.all([
    getTransaction(transactionHash),
    getTransactionReceipt(transactionHash),
    getBlock(blockNumber),
  ]);

  if (block === null) {
    throw new Error(`Block not found: ${blockNumber}`);
  }

  if (tx === undefined) {
    throw new Error(`Transaction not found: ${transactionHash}`);
  }

  if (receipt === undefined) {
    throw new Error(`No receipt found for transaction: ${transactionHash}`);
  }

  const transaction = buildTransaction(tx, receipt, block);
  const bridgeTransferEvents = getERC20BridgeTransferEvents(receipt);

  /**
   * Store data within a transaction to ensure consistency. This allows the
   * assumption that if a transaction exists then the bridge events do too.
   */
  await withTransaction(async session => {
    if (bridgeTransferEvents.length > 0) {
      await persistEvents(bridgeTransferEvents, { session });
    }

    await persistTransaction(transaction, { session });
  });

  logger.success(`fetched transaction: ${transactionHash}`);
};

module.exports = {
  fn: fetchTransaction,
  jobName: JOB.FETCH_TRANSACTION,
  queueName: QUEUE.TRANSACTION_PROCESSING,
};
