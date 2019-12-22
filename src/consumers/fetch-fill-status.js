const _ = require('lodash');
const mongoose = require('mongoose');
const signale = require('signale');

const { FILL_STATUS, JOB, QUEUE } = require('../constants');
const { getModel } = require('../model');
const { publishJob } = require('../queues');
const getTransactionReceipt = require('../util/ethereum/get-transaction-receipt');

const logger = signale.scope('fetch fill status');

const fetchFillStatus = async job => {
  const { fillId, transactionHash } = job.data;

  if (!mongoose.Types.ObjectId.isValid(fillId)) {
    throw new Error(`Invalid fillId: ${fillId}`);
  }

  if (_.isEmpty(transactionHash)) {
    throw new Error(`Invalid transactionHash: ${transactionHash}`);
  }

  const receipt = await getTransactionReceipt(transactionHash);

  if (receipt === undefined) {
    throw new Error(`No receipt found for transaction: ${transactionHash}`);
  }

  const status =
    receipt.status === 0 ? FILL_STATUS.FAILED : FILL_STATUS.SUCCESSFUL;
  const statusText = _.findKey(FILL_STATUS, value => value === status);
  const result = await getModel('Fill').updateOne({ _id: fillId }, { status });

  if (result.modifiedCount === 0) {
    throw new Error(`No fill found with the id: ${fillId}`);
  }

  await publishJob(QUEUE.FILL_INDEXING, JOB.INDEX_FILL_STATUS, {
    fillId,
    status,
  });

  logger.success(`set status of fill ${fillId} to ${statusText}`);
};

module.exports = {
  fn: fetchFillStatus,
  jobName: JOB.FETCH_FILL_STATUS,
  queueName: QUEUE.FILL_PROCESSING,
};
