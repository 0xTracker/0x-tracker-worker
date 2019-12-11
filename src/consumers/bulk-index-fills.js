const _ = require('lodash');

const signale = require('signale');

const { publishJob } = require('../queues');
const { JOB, QUEUE } = require('../constants');
const { getModel } = require('../model');
const elasticsearch = require('../util/elasticsearch');
const fillsIndex = require('../index/fills');

const logger = signale.scope('bulk index fills');

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

  const lastFill = fills[fills.length - 1];

  logger.success(
    `indexed ${fills.length} fills from ${fills[0]._id} to ${lastFill._id}`,
  );

  if (fills.length === batchSize) {
    await publishJob(
      QUEUE.BULK_INDEXING,
      JOB.BULK_INDEX_FILLS,
      {
        batchSize,
        lastFillId: lastFill._id,
      },
      { jobId: `bulk-index-${lastFill._id}` },
    );
  } else {
    logger.success('bulk indexing has finished for all fills');
  }
};

module.exports = {
  fn: bulkIndexFills,
  jobName: JOB.BULK_INDEX_FILLS,
  queueName: QUEUE.BULK_INDEXING,
};
