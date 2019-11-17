const _ = require('lodash');
const signale = require('signale');

const { FILL_STATUS } = require('../constants');
const Fill = require('../model/fill');
const getTransactionReceipt = require('../util/ethereum/get-transaction-receipt');

const logger = signale.scope('fetch fill status');

const fetchFillStatusConsumer = async job => {
  const { fillId, transactionHash } = job.data;
  const receipt = await getTransactionReceipt(transactionHash);

  if (receipt === undefined) {
    throw new Error(`No receipt found for transaction: ${transactionHash}`);
  }

  const status =
    receipt.status === 0 ? FILL_STATUS.FAILED : FILL_STATUS.SUCCESSFUL;
  const statusText = _.findKey(FILL_STATUS, value => value === status);

  await Fill.updateOne({ _id: fillId }, { status });

  logger.success(`set status of fill ${fillId} to ${statusText}`);
};

module.exports = fetchFillStatusConsumer;
