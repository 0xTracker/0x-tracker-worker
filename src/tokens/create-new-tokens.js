const { JOB, QUEUE } = require('../constants');
const { publishJob } = require('../queues');
const getExistingTokens = require('./get-existing-tokens');

const createNewTokens = async tokens => {
  if (tokens.length === 0) {
    return;
  }

  const tokenAddresses = tokens.map(token => token.address);
  const existingTokens = await getExistingTokens(tokenAddresses);

  if (existingTokens.length === tokenAddresses.length) {
    return;
  }

  const newTokens = tokens.filter(token => {
    return !existingTokens.some(et => et === token.address);
  });

  await Promise.all(
    newTokens.map(async token => {
      await publishJob(
        QUEUE.TOKEN_PROCESSING,
        JOB.CREATE_TOKEN,
        {
          tokenAddress: token.address,
          tokenType: token.type,
        },
        { jobId: `create-token-${token.address}` },
      );
    }),
  );
};

module.exports = createNewTokens;
