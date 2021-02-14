const _ = require('lodash');
const ms = require('ms');

const { JOB, QUEUE, TOKEN_TYPE } = require('../constants');
const { getModel } = require('../model');
const { publishJob } = require('../queues');

const createToken = async (job, { logger }) => {
  const { tokenAddress, tokenType } = job.data;

  if (_.isEmpty(tokenAddress)) {
    throw new Error('Job data is missing tokenAddress');
  }

  if (!Object.values(TOKEN_TYPE).includes(tokenType)) {
    throw new Error(`Invalid tokenType: ${tokenType}`);
  }

  const Token = getModel('Token');
  const token = await Token.findOne({ address: tokenAddress }).lean();

  if (token !== null) {
    logger.warn(`token already exists: ${tokenAddress}`);
    return undefined;
  }

  const newToken = await Token.create({
    address: tokenAddress,
    resolved: false,
    type: tokenType,
  });

  await publishJob(
    QUEUE.TOKEN_PROCESSING,
    JOB.FETCH_TOKEN_METADATA,
    {
      tokenAddress,
      tokenType,
    },
    {
      delay: ms('30 seconds'),
      jobId: `fetch-token-metadata-${tokenAddress}`,
    },
  );

  logger.info(`created token: ${tokenAddress}`);

  return newToken;
};

module.exports = {
  fn: createToken,
  jobName: JOB.CREATE_TOKEN,
  queueName: QUEUE.TOKEN_PROCESSING,
};
