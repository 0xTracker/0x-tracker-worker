const signale = require('signale');

const { publishJob } = require('../queues');
const { JOB, QUEUE } = require('../constants');
const { getModel } = require('../model');

const logger = signale.scope('reindex fills');

const reindexFills = async job => {
  const { batchSize, lastFillId } = job.data;
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
  }

  fills.forEach(fill => {
    publishJob(QUEUE.FILL_INDEXING, JOB.INDEX_FILL, { fillId: fill._id });
  });

  logger.success(`reindexing scheduled for ${fills.length} fills`);

  if (fills.length === batchSize) {
    publishJob(QUEUE.FILL_INDEXING, JOB.REINDEX_FILLS, {
      batchSize,
      lastFillId: new Error('kaboom'),
    });
  }
};

module.exports = reindexFills;
