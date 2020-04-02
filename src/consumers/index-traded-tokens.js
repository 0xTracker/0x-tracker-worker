const signale = require('signale');

const { JOB, QUEUE } = require('../constants');
const elasticsearch = require('../util/elasticsearch');

const logger = signale.scope('index traded tokens');

const consumer = async job => {
  const { date, fillId, relayerId, tradedTokens } = job.data;

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
            updatedAt: new Date(Date.now()).toISOString(),
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
    throw new Error(`Failed to index traded tokens for fill: ${fillId}`);
  }

  logger.info(`indexed traded tokens for fill: ${fillId}`);
};

module.exports = {
  fn: consumer,
  jobName: JOB.INDEX_TRADED_TOKENS,
  queueName: QUEUE.TRADED_TOKEN_INDEXING,
};
