const _ = require('lodash');
const bluebird = require('bluebird');
const signale = require('signale');

const { publishJob } = require('../queues');
const { JOB, QUEUE } = require('../constants');
const { getModel } = require('../model');

const logger = signale.scope('reindex fills');

const reindexFills = async job => {
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
    logger.success('reindexing has been scheduled for all fills');
    return;
  }

  await bluebird.each(fills, async fill => {
    await publishJob(
      QUEUE.FILL_INDEXING,
      JOB.INDEX_FILL,
      { fillId: fill._id },
      { removeOnComplete: true },
    );
  });

  logger.success(`reindexing scheduled for ${fills.length} fills`);

  if (fills.length === batchSize) {
    await publishJob(
      QUEUE.FILL_INDEXING,
      JOB.REINDEX_FILLS,
      {
        batchSize,
        lastFillId: fills[fills.length - 1]._id,
      },
      { removeOnComplete: true },
    );
  }
};

module.exports = reindexFills;
