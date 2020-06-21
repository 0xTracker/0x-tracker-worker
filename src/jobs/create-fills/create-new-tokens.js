const { JOB, QUEUE } = require('../../constants');
const { getModel } = require('../../model');
const { publishJob } = require('../../queues');

const createNewTokens = async tokens => {
  const Token = getModel('Token');
  const newTokens = await Token.find({
    address: { $nin: tokens.map(token => token.address) },
  });

  if (newTokens.length === 0) {
    return;
  }

  await Promise.all(
    newTokens.map(async token => {
      await publishJob(QUEUE.TOKEN_PROCESSING, JOB.CREATE_TOKEN, {
        tokenAddress: token.address,
        tokenType: token.type,
      });
    }),
  );
};

module.exports = createNewTokens;
