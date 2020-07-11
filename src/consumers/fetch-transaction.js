const _ = require('lodash');
const signale = require('signale');

const { JOB, QUEUE } = require('../constants');
const { getModel } = require('../model');
const getBlock = require('../util/ethereum/get-block');
const getTransaction = require('../util/ethereum/get-transaction');
const getTransactionReceipt = require('../util/ethereum/get-transaction-receipt');

const logger = signale.scope('fetch transaction');

const createTransactionDocument = (tx, receipt, block) => {
  let affiliateAddress;
  let quoteTimestamp;

  if (tx.input.includes('869584cd')) {
    const bytesPos = tx.input.indexOf('869584cd');
    affiliateAddress = '0x'.concat(
      tx.input.slice(bytesPos + 32, bytesPos + 72),
    );
    quoteTimestamp = new Date(
      parseInt(tx.input.slice(bytesPos + 128, bytesPos + 136), 16) * 1000,
    );
  }

  if (tx.input.includes('fbc019a7')) {
    const bytesPos = tx.input.indexOf('fbc019a7');
    affiliateAddress = '0x'.concat(
      tx.input.slice(bytesPos + 32, bytesPos + 72),
    );
  }

  return {
    affiliateAddress,
    blockHash: tx.blockHash,
    blockNumber: tx.blockNumber,
    data: tx.input,
    from: tx.from,
    gasLimit: tx.gas,
    gasPrice: tx.gasPrice.toString(),
    gasUsed: receipt.gasUsed,
    hash: tx.hash,
    index: receipt.transactionIndex,
    nonce: tx.nonce,
    quoteTimestamp,
    timestamp: new Date(block.timestamp * 1000),
    to: tx.to,
    value: tx.value.toString(),
  };
};

const fetchTransaction = async job => {
  const { blockNumber, transactionHash } = job.data;

  logger.info(`fetching transaction: ${transactionHash}`);

  if (_.isEmpty(transactionHash)) {
    throw new Error(`Invalid transactionHash: ${transactionHash}`);
  }

  const existingTx = await getModel('Transaction').findOne({
    hash: transactionHash,
  });

  if (existingTx !== null) {
    logger.warn(`transaction has already been fetched: ${transactionHash}`);
    return;
  }

  const [tx, receipt, block] = await Promise.all([
    getTransaction(transactionHash),
    getTransactionReceipt(transactionHash),
    getBlock(blockNumber),
  ]);

  if (block === undefined) {
    throw new Error(`Block not found: ${transactionHash}`);
  }

  if (tx === undefined) {
    throw new Error(`Transaction not found: ${transactionHash}`);
  }

  if (receipt === undefined) {
    throw new Error(`No receipt found for transaction: ${transactionHash}`);
  }

  const transaction = createTransactionDocument(tx, receipt, block);
  const Transaction = getModel('Transaction');

  await Transaction.create(transaction);

  logger.success(`fetched transaction: ${transactionHash}`);
};

module.exports = {
  fn: fetchTransaction,
  jobName: JOB.FETCH_TRANSACTION,
  queueName: QUEUE.TRANSACTION_PROCESSING,
};
