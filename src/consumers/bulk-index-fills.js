const _ = require('lodash');
const signale = require('signale');

const { publishJob } = require('../queues');
const { JOB, QUEUE } = require('../constants');
const { getModel } = require('../model');

const logger = signale.scope('reindex fills');

const bulkIndexFills = async job => {
  const { batchSize, lastFillId } = job.data;

  if (!_.isFinite(batchSize) || batchSize <= 0) {
    throw new Error(`Invalid batchSize: ${batchSize}`);
  }

  const fills = await getModel('Fill')
    .find(
      lastFillId === undefined
        ? undefined
        : {
            _id: { $gt: lastFillId },
          },
    )
    .limit(batchSize);

  if (fills.length === 0) {
    logger.success('bulk indexing has been scheduled for all fills');
    return;
  }

  await Promise.all(
    fills.map(
      fill =>
        new Promise((resolve, reject) => {
          fill.index(error => {
            if (error) {
              reject(error);
            } else {
              logger.success(`indexed fill: ${fill._id}`);
              resolve();
            }
          });
        }),
    ),
  );

  if (fills.length === batchSize) {
    await publishJob(
      QUEUE.BULK_INDEXING,
      JOB.BULK_INDEX_FILLS,
      {
        batchSize,
        lastFillId: fills[fills.length - 1]._id,
      },
      // { removeOnComplete: true },
    );
  }
};

module.exports = {
  fn: bulkIndexFills,
  jobName: JOB.BULK_INDEX_FILLS,
  queueName: QUEUE.BULK_INDEXING,
};
