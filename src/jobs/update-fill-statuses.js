const { findKey } = require('lodash');
const bluebird = require('bluebird');
const signale = require('signale');

const { FILL_STATUS } = require('../constants');
const Fill = require('../model/fill');
const getTransactionReceipt = require('../util/ethereum/get-transaction-receipt');

const logger = signale.scope('update fill statuses');

const updateFillStatuses = async ({ batchSize, processOldestFirst }) => {
  const fills = await Fill.find({ status: FILL_STATUS.PENDING })
    .sort({ date: processOldestFirst ? 1 : -1 })
    .limit(batchSize)
    .lean();

  if (fills.length === 0) {
    logger.info('no pending fills were found');
    return;
  }

  logger.pending(`updating status of ${fills.length} fills`);

  await bluebird.mapSeries(fills, async fill => {
    const receipt = await getTransactionReceipt(fill.transactionHash);

    if (receipt === null) {
      logger.warn(`no receipt found for ${fill.transactionHash}`);
      return;
    }

    const status =
      receipt.status === 1 ? FILL_STATUS.SUCCESSFUL : FILL_STATUS.FAILED;

    await Fill.updateOne({ _id: fill._id }, { status });

    logger.success(
      `set status to ${findKey(FILL_STATUS, value => value === status)} for ${
        fill.transactionHash
      }`,
    );
  });

  logger.success(`updated status of ${fills.length} fills`);
};

module.exports = updateFillStatuses;
