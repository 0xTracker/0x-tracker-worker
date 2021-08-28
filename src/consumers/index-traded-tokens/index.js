const _ = require('lodash');

const { JOB, QUEUE, FILL_ATTRIBUTION_TYPE } = require('../../constants');
const elasticsearch = require('../../util/elasticsearch');
const getIndexName = require('../../index/get-index-name');

// TODO: Move this logic into index-fill and index-fill-value consumers
const consumer = async (job, { logger }) => {
  const { attributions, date, fillId, tradedTokens } = job.data;

  logger.info(`indexing traded tokens for fill: ${fillId}`);

  const liquiditySource = _.find(
    attributions,
    a => a.type === FILL_ATTRIBUTION_TYPE.LIQUIDITY_SOURCE,
  );

  const body = tradedTokens
    .map(tradedToken => {
      const doc = {
        attributions,
        fillId,
        date,
        tokenAddress: tradedToken.address,
        tokenType: tradedToken.type,
        liquiditySourceId: liquiditySource ? liquiditySource.id : undefined,
        tradeCountContribution: tradedToken.tradeCountContribution,
        tradedAmount: tradedToken.tradedAmount,
        tradedAmountUSD: tradedToken.tradedAmountUSD,
        priceUSD: tradedToken.priceUSD,
      };

      return [
        JSON.stringify({
          update: {
            _id: `${fillId}_${tradedToken.address}`,
          },
        }),
        JSON.stringify({
          doc,

          /* 
            Note: doc_as_upsert cannot be used because of an ingest pipeline
            that is configured on the index.

            https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-update.html#doc_as_upsert
          */
          upsert: doc,
        }),
      ].join('\n');
    })
    .join('\n');

  const result = await elasticsearch
    .getClient()
    .bulk({ body: `${body}\n`, index: getIndexName('traded_tokens') });

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
  queueName: QUEUE.INDEXING,
};
