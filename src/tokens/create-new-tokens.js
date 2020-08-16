const ms = require('ms');

const { JOB, QUEUE } = require('../constants');
const { publishJob } = require('../queues');
const getExistingTokens = require('./get-existing-tokens');
const Token = require('../model/token');
const withTransaction = require('../util/with-transaction');

const createNewTokens = async tokens => {
  if (tokens.length === 0) {
    return;
  }

  const tokenAddresses = tokens.map(token => token.address.toLowerCase());
  const existingTokens = await getExistingTokens(tokenAddresses);

  if (existingTokens.length === tokenAddresses.length) {
    return;
  }

  const newTokens = tokens.filter(token => {
    return !existingTokens.some(et => et === token.address.toLowerCase());
  });

  await withTransaction(async session => {
    await Promise.all(
      newTokens.map(token =>
        Token.updateOne(
          { address: token.address },
          {
            $set: {
              address: token.address,
              type: token.type,
            },
          },
          { session, setDefaultsOnInsert: true, upsert: true },
        ),
      ),
    );

    await Promise.all(
      newTokens.map(async token => {
        await publishJob(
          QUEUE.TOKEN_PROCESSING,
          JOB.FETCH_TOKEN_METADATA,
          {
            tokenAddress: token.address.toLowerCase(),
            tokenType: token.type,
          },
          {
            delay: ms('30 seconds'),
            jobId: `fetch-token-metadata-${token.address}`,
          },
        );
      }),
    );
  });
};

module.exports = createNewTokens;
