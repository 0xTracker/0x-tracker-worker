const _ = require('lodash');
const signale = require('signale');

const { JOB, QUEUE } = require('../constants');
const elasticsearch = require('../util/elasticsearch');

const logger = signale.scope('index traded token values');

const consumer = async job => {
  const { fillId, tokenValues } = job.data;

  logger.info(`indexing token values for fill: ${fillId}`);

  const body = _(tokenValues)
    .map((values, tokenAddress) => {
      return [
        JSON.stringify({
          update: {
            _id: `${fillId}_${tokenAddress}`,
          },
        }),
        JSON.stringify({
          script: {
            source:
              `ctx._source.filledAmount = params.amount;` +
              `ctx._source.filledAmountUSD = params.amountUSD;` +
              `ctx._source.tradedAmount = params.amount * ctx._source.tradeCountContribution;` +
              `ctx._source.tradedAmountUSD = params.amountUSD * ctx._source.tradeCountContribution;` +
              `ctx._source.priceUSD = params.priceUSD;` +
              `ctx._source.updatedAt = params.updatedAt;`,
            params: {
              amount: values.amount,
              amountUSD: values.amountUSD,
              priceUSD: values.priceUSD,
              updatedAt: new Date().toISOString(),
            },
          },
        }),
      ].join('\n');
    })
    .join('\n');

  const result = await elasticsearch
    .getClient()
    .bulk({ body: `${body}\n`, index: 'traded_tokens' });

  if (result.body.errors === true) {
    throw new Error(`Failed to bulk index token values for fill: ${fillId}`);
  }

  logger.info(`indexed token values for fill: ${fillId}`);
};

module.exports = {
  fn: consumer,
  jobName: JOB.INDEX_TRADED_TOKEN_VALUES,
  queueName: QUEUE.TRADED_TOKEN_INDEXING,
};
