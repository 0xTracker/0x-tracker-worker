const { findKey } = require('lodash');
const bluebird = require('bluebird');
const signale = require('signale');

const { FILL_STATUS } = require('../constants');
const Fill = require('../model/fill');
const getTransactionReceipt = require('../util/ethereum/get-transaction-receipt');

const logger = signale.scope('update fill statuses');

const updateFillStatuses = async ({ batchSize }) => {
  logger.time('fetch pending fills');

  const fills = await Fill.find({ status: FILL_STATUS.PENDING })
    .limit(batchSize)
    .lean();

  logger.timeEnd('fetch pending fills');

  if (fills.length === 0) {
    logger.info('no pending fills were found');
    return;
  }

  logger.time(`update status of ${fills.length} fills`);

  await bluebird.mapSeries(fills, async fill => {
    logger.time(`fetch transaction receipt: ${fill.transactionHash}`);

    const receipt = await getTransactionReceipt(fill.transactionHash);

    logger.timeEnd(`fetch transaction receipt: ${fill.transactionHash}`);

    if (receipt === undefined) {
      logger.warn(`no receipt found for ${fill.transactionHash}`);
      return;
    }

    const status =
      receipt.status === 0 ? FILL_STATUS.FAILED : FILL_STATUS.SUCCESSFUL;

    const statusText = findKey(FILL_STATUS, value => value === status);

    logger.time(`set status of fill ${fill._id} to ${statusText}`);

    await Fill.updateOne({ _id: fill._id }, { status });

    logger.timeEnd(`set status of fill ${fill._id} to ${statusText}`);
  });

  logger.timeEnd(`update status of ${fills.length} fills`);
};

module.exports = updateFillStatuses;
