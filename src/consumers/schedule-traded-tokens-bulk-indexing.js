const _ = require('lodash');
const bluebird = require('bluebird');
const signale = require('signale');

const { JOB, QUEUE } = require('../constants');
const { getModel } = require('../model');
const { publishJob } = require('../queues');

const logger = signale.scope('scheduled traded tokens bulk indexing');

const processBatch = async (batchSize, jobCount, lastFillId) => {
  const query =
    lastFillId === undefined ? undefined : { _id: { $gt: lastFillId } };

  const fills = await getModel('Fill')
    .find(query)
    .limit(batchSize)
    .select({ _id: 1 })
    .lean();

  if (fills.length === 0) {
    logger.info(`all jobs have been scheduled for traded tokens bulk indexing`);
  }

  const chunks = _.chunk(fills, batchSize / jobCount);

  await bluebird.each(chunks, async chunk => {
    const fillIds = chunk.map(fill => fill._id);

    await publishJob(QUEUE.BULK_INDEXING, JOB.BULK_INDEX_TRADED_TOKENS, {
      fillIds,
    });
  });

  if (fills.length === batchSize) {
    await processBatch(batchSize, jobCount, fills[fills.length - 1]._id);
  }
};

const consumer = async job => {
  const { batchSize, jobCount } = job.data;

  if (batchSize % jobCount !== 0) {
    throw new Error(`Batch size must be divisible by job count.`);
  }

  await processBatch(batchSize, jobCount);
};

module.exports = {
  fn: consumer,
  jobName: JOB.SCHEDULE_TRADED_TOKENS_BULK_INDEXING,
  queueName: QUEUE.BULK_INDEXING,
};
