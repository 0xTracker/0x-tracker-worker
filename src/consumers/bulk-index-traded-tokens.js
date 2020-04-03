const _ = require('lodash');

const signale = require('signale');

const { publishJob } = require('../queues');
const { JOB, QUEUE } = require('../constants');
const { getModel } = require('../model');
const elasticsearch = require('../util/elasticsearch');
const getTradedTokens = require('../fills/get-traded-tokens');

const logger = signale.scope('bulk index fills');

const createQuery = lastFillId => {
  let query = {};

  if (lastFillId !== undefined) {
    query = { ...query, _id: { $gt: lastFillId } };
  }

  return query;
};

const consumer = async job => {
  const { batchSize } = job.data;

  if (!_.isFinite(batchSize) || batchSize <= 0) {
    throw new Error(`Invalid batchSize: ${batchSize}`);
  }

  const batch = await getModel('Fill')
    .find(createQuery(job.data.lastFillId), '_id')
    .limit(batchSize)
    .lean();

  if (batch.length === 0) {
    logger.info('bulk indexing has been scheduled for all traded tokens');
    return;
  }

  const lastFillId = batch[batch.length - 1]._id;
  const batchId = job.data.batchId || Date.now();

  // Get on with processing the next batch whilst this one is being processed
  // to improve batch indexing throughput.
  if (batch.length === batchSize) {
    await publishJob(
      QUEUE.BULK_INDEXING,
      JOB.BULK_INDEX_TRADED_TOKENS,
      {
        batchId,
        batchSize,
        lastFillId,
      },
      {
        jobId: `bulk-index-traded-tokens-${batchId}-${lastFillId}`,
      },
    );
    logger.info(`scheduled indexing for next batch of traded tokens`);
  }

  const fillIds = batch.map(match => match._id);
  const fills = await getModel('Fill')
    .find({ _id: { $in: fillIds } })
    .populate([{ path: 'relayer' }, { path: 'assets.token' }]);

  const body = fills
    .map(fill =>
      getTradedTokens(fill)
        .map(tradedToken =>
          [
            JSON.stringify({
              update: {
                _id: `${fill._id}_${tradedToken.address}`,
              },
            }),
            JSON.stringify({
              doc: {
                fillId: fill._id,
                date: fill.date,
                tokenAddress: tradedToken.address,
                relayerId: fill.relayerId,
                tokenType: tradedToken.type,
                filledAmount: tradedToken.filledAmount,
                filledAmountUSD: tradedToken.filledAmountUSD,
                tradeCountContribution: tradedToken.tradeCountContribution,
                tradedAmount: tradedToken.tradedAmount,
                tradedAmountUSD: tradedToken.tradedAmountUSD,
                priceUSD: tradedToken.priceUSD,
                updatedAt: new Date().toISOString(),
              },
              doc_as_upsert: true,
            }),
          ].join('\n'),
        )
        .join('\n'),
    )
    .join('\n');

  const result = await elasticsearch
    .getClient()
    .bulk({ body: `${body}\n`, index: 'traded_tokens' });

  if (result.body.errors === true) {
    const errorMessage = _.get(
      result,
      'body.items[0].update.error.reason',
      `Failed to bulk index traded tokens`,
    );
    throw new Error(errorMessage);
  }

  logger.info(`indexed batch of traded tokens: ${fills.length}`);

  if (fills.length < batchSize) {
    logger.info('bulk indexing of traded tokens has finished');
  }
};

module.exports = {
  fn: consumer,
  jobName: JOB.BULK_INDEX_TRADED_TOKENS,
  queueName: QUEUE.BULK_INDEXING,
};
