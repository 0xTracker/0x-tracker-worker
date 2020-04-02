const { JOB, QUEUE } = require('../constants');
const { publishJob } = require('../queues');

const indexTradedTokenValues = (fill, tokenValues) => {
  if (Object.keys(tokenValues).length === 0) {
    throw new Error(`No token values specified for fill: ${fill._id}`);
  }

  publishJob(QUEUE.TRADED_TOKEN_INDEXING, JOB.INDEX_TRADED_TOKEN_VALUES, {
    fillId: fill._id,
    tokenValues,
  });
};

module.exports = indexTradedTokenValues;
