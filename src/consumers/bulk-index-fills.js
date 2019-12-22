const _ = require('lodash');

const signale = require('signale');

const { publishJob } = require('../queues');
const { JOB, QUEUE } = require('../constants');
const { getModel } = require('../model');
const elasticsearch = require('../util/elasticsearch');
const fillsIndex = require('../index/fills');

const logger = signale.scope('bulk index fills');

const bulkIndexFills = async job => {
  const { batchSize } = job.data;

  if (!_.isFinite(batchSize) || batchSize <= 0) {
    throw new Error(`Invalid batchSize: ${batchSize}`);
  }

  const nextBatch = await getModel('Fill')
    .find(
      job.data.lastFillId === undefined
        ? undefined
        : {
            _id: { $gt: job.data.lastFillId },
          },
      '_id',
    )
    .limit(batchSize);

  if (nextBatch.length === 0) {
    logger.success('bulk indexing has been scheduled for all fills');
    return;
  }

  const lastFillId = nextBatch[nextBatch.length - 1]._id;
  const batchId = job.data.batchId || Date.now();

  // Get on with processing the next batch whilst this one is being processed
  // to improve batch indexing throughput.
  if (nextBatch.length === batchSize) {
    await publishJob(
      QUEUE.BULK_INDEXING,
      JOB.BULK_INDEX_FILLS,
      {
        batchId,
        batchSize,
        lastFillId,
      },
      { jobId: `bulk-index-${batchId}-${lastFillId}`, removeOnComplete: false },
    );
    logger.success(
      `scheduled indexing of next ${batchSize} fills after ${lastFillId}`,
    );
  }

  const fillIds = nextBatch.map(match => match._id);
  const fills = await getModel('Fill').find({ _id: { $in: fillIds } });

  const body = fills
    .map(fill => {
      return [
        JSON.stringify({
          index: {
            _id: fill._id,
          },
        }),
        JSON.stringify(fillsIndex.createDocument(fill)),
      ].join('\n');
    })
    .join('\n');

  await elasticsearch.getClient().bulk({ body: `${body}\n`, index: 'fills' });

  logger.success(
    `indexed ${fills.length} fills from ${fills[0]._id} to ${lastFillId}`,
  );

  if (fills.length < batchSize) {
    logger.success('bulk indexing has finished');
  }
};

module.exports = {
  fn: bulkIndexFills,
  jobName: JOB.BULK_INDEX_FILLS,
  queueName: QUEUE.BULK_INDEXING,
};
