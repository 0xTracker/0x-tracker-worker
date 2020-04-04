const _ = require('lodash');

const signale = require('signale');

const { JOB, QUEUE } = require('../constants');
const { getModel } = require('../model');
const elasticsearch = require('../util/elasticsearch');
const getTradedTokens = require('../fills/get-traded-tokens');

const logger = signale.scope('bulk index traded tokens');

const consumer = async job => {
  const { fillIds } = job.data;

  if (!Array.isArray(fillIds)) {
    throw new Error(`Invalid fillIds: ${fillIds}`);
  }

  const fills = await getModel('Fill')
    .find({ _id: { $in: fillIds } })
    .populate([{ path: 'relayer' }, { path: 'assets.token' }])
    .lean();

  if (fills.length === 0) {
    return;
  }

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
};

module.exports = {
  fn: consumer,
  jobName: JOB.BULK_INDEX_TRADED_TOKENS,
  queueName: QUEUE.BULK_INDEXING,
};
