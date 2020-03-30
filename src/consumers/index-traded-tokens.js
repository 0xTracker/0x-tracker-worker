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
          index: {
            _id: `${fillId}_${tradedToken.address}`,
          },
        }),
        JSON.stringify({
          fillId,
          date,
          tokenAddress: tradedToken.address,
          relayerId,
          tokenType: tradedToken.type,
          amount: tradedToken.amount,
          amountUSD: tradedToken.amountUSD,
          priceUSD: tradedToken.priceUSD,
          updatedAt: new Date(Date.now()).toISOString(),
        }),
      ].join('\n');
    })
    .join('\n');

  await elasticsearch
    .getClient()
    .bulk({ body: `${body}\n`, index: 'traded_tokens' });

  logger.info(`indexed traded tokens for fill: ${fillId}`);
};

module.exports = {
  fn: consumer,
  jobName: JOB.INDEX_TRADED_TOKENS,
  queueName: QUEUE.TRADED_TOKEN_INDEXING,
};
