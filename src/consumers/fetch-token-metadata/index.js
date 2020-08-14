const ms = require('ms');

const { JOB, QUEUE } = require('../../constants');
const { publishJob } = require('../../queues');
const persistTokenMetadata = require('./persist-token-metadata');
const resolveToken = require('../../tokens/resolve-token');

const scheduleRerun = async (job, delay) => {
  const { tokenAddress, tokenType } = job.data;

  publishJob(
    QUEUE.TOKEN_PROCESSING,
    JOB.FETCH_TOKEN_METADATA,
    {
      tokenAddress,
      tokenType,
    },
    {
      delay,
    },
  );
};

const consumer = async (job, { logger }) => {
  const { tokenAddress, tokenType } = job.data;

  logger.info(`fetching token metadata: ${tokenAddress}`);

  const tokenMetadata = await resolveToken(tokenAddress, tokenType);

  if (tokenMetadata === null) {
    logger.warn(`token metadata not found: ${tokenAddress}`);
    await scheduleRerun(job, ms('1 hour'));
    return;
  }

  const updatedFields = await persistTokenMetadata(tokenAddress, tokenMetadata);

  if (updatedFields.length === 0) {
    logger.warn(`metadata for token did not need updating: ${tokenAddress}`);
  } else {
    const updatedFieldNames = updatedFields.join(', ');

    logger.info(
      `updated metadata for token: ${tokenAddress} (${updatedFieldNames})`,
    );
  }

  if (Object.values(tokenMetadata).some(value => value === null)) {
    await scheduleRerun(job, ms('1 hour'));
  } else {
    await scheduleRerun(job, ms('1 day'));
  }
};

module.exports = {
  fn: consumer,
  jobName: JOB.FETCH_TOKEN_METADATA,
  queueName: QUEUE.TOKEN_PROCESSING,
};
