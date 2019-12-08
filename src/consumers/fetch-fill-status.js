const _ = require('lodash');
const signale = require('signale');

const { FILL_STATUS, JOB, QUEUE } = require('../constants');
const { getModel } = require('../model');
const { publishJob } = require('../queues');
const getTransactionReceipt = require('../util/ethereum/get-transaction-receipt');
const withTransaction = require('../util/with-transaction');

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

  await withTransaction(async session => {
    await getModel('Fill').updateOne({ _id: fillId }, { status }, { session });
    await publishJob(
      QUEUE.FILL_INDEXING,
      JOB.INDEX_FILL,
      {
        fillId,
      },
      { removeOnComplete: true },
    );
  });

  logger.success(`set status of fill ${fillId} to ${statusText}`);
};

module.exports = fetchFillStatusConsumer;
