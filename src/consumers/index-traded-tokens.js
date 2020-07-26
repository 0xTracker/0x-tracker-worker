const _ = require('lodash');
const signale = require('signale');

const { JOB, QUEUE } = require('../constants');
const elasticsearch = require('../util/elasticsearch');

const logger = signale.scope('index traded tokens');

const consumer = async job => {
  const { apps, date, fillId, relayerId, tradedTokens } = job.data;

  logger.info(`indexing traded tokens for fill: ${fillId}`);

  const body = tradedTokens
    .map(tradedToken => {
      return [
        JSON.stringify({
          update: {
            _id: `${fillId}_${tradedToken.address}`,
          },
        }),
        JSON.stringify({
          doc: {
            apps,
            fillId,
            date,
            tokenAddress: tradedToken.address,
            relayerId,
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
      ].join('\n');
    })
    .join('\n');

  const result = await elasticsearch
    .getClient()
    .bulk({ body: `${body}\n`, index: 'traded_tokens' });

  if (result.body.errors === true) {
    const errorMessage = _.get(
      result,
      'body.items[0].update.error.reason',
      `Failed to index traded tokens for fill: ${fillId}`,
    );
    throw new Error(errorMessage);
  }

  logger.info(`indexed traded tokens for fill: ${fillId}`);
};

module.exports = {
  fn: consumer,
  jobName: JOB.INDEX_TRADED_TOKENS,
  queueName: QUEUE.TRADED_TOKEN_INDEXING,
};
