const { JOB, QUEUE } = require('../../constants');
const persistTokenMetadata = require('./persist-token-metadata');
const resolveToken = require('../../tokens/resolve-token');

const consumer = async (job, { logger }) => {
  const { tokenAddress, tokenType } = job.data;

  logger.info(`fetching token metadata: ${tokenAddress}`);

  const tokenMetadata = await resolveToken(tokenAddress, tokenType);

  if (tokenMetadata === null) {
    logger.warn(`token metadata not found: ${tokenAddress}`);
    return;
  }

  await persistTokenMetadata(tokenAddress, tokenMetadata);

  logger.info(`fetched metadata for token: ${tokenAddress}`);
};

module.exports = {
  fn: consumer,
  jobName: JOB.FETCH_TOKEN_METADATA,
  queueName: QUEUE.ETH_DATA,
};
