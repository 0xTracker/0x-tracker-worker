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

  publishJob(QUEUE.TRADED_TOKEN_INDEXING, JOB.INDEX_TRADED_TOKENS, {
    date: fill.date,
    fillId: fill._id,
    relayerId: fill.relayerId,
    tradedTokens,
  });
};

module.exports = indexTradedTokens;
