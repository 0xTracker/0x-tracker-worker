const { JOB, QUEUE } = require('../constants');
const { publishJob } = require('../queues');
const getTradedTokens = require('../fills/get-traded-tokens');

/*
  Publish a job to index the traded tokens of a given fill. The fill
  provided must have its asset tokens populated.
*/
const indexTradedTokens = fill => {
  const tradedTokens = getTradedTokens(fill);

  if (tradedTokens.length === 0) {
    throw new Error(`No traded tokens for fill: ${fill._id}`);
  }

  const fillId = fill._id.toString();

  publishJob(
    QUEUE.TRADED_TOKEN_INDEXING,
    JOB.INDEX_TRADED_TOKENS,
    {
      attributions: fill.attributions.map(attribution => ({
        id: attribution.entityId,
        type: attribution.type,
      })),
      date: fill.date,
      fillId,
      relayerId: fill.relayerId,
      tradedTokens,
    },
    { jobId: `index-traded-tokens-${fillId}` },
  );
};

module.exports = indexTradedTokens;
