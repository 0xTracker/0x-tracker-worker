const _ = require('lodash');
const ms = require('ms');
const signale = require('signale');

const { JOB, QUEUE } = require('../../constants');
const { getModel } = require('../../model');
const { publishJob } = require('../../queues');
const persistTokenMetadata = require('./persist-token-metadata');
const resolveToken = require('../../tokens/resolve-token');

const tokenCache = require('../../tokens/token-cache');
const withTransaction = require('../../util/with-transaction');

const logger = signale.scope('fetch token metadata');

const consumer = async job => {
  const { tokenAddress, tokenType } = job.data;

  logger.info(`fetching token metadata: ${tokenAddress}`);

  const resolvedToken = await resolveToken(tokenAddress, tokenType);

  if (resolvedToken === null) {
    logger.warn(`token metadata not found: ${tokenAddress}`);
    publishJob(
      QUEUE.TOKEN_PROCESSING,
      JOB.FETCH_TOKEN_METADATA,
      {
        tokenAddress,
        tokenType,
      },
      {
        delay: ms('1 hour'),
        jobId: `fetch-token-metadata-retry-${tokenAddress}`,
      },
    );
    return;
  }

  const tokenDetails = _.pick(resolvedToken, [
    'address',
    'decimals',
    'name',
    'symbol',
  ]);

  await withTransaction(async session => {
    await persistTokenMetadata(tokenAddress, tokenDetails, session);
    await getModel('Fill').updateMany(
      {
        'assets.tokenAddress': tokenAddress,
      },
      {
        $set: {
          'assets.$[element].tokenResolved': true,
        },
      },
      {
        arrayFilters: [
          {
            'element.tokenAddress': tokenAddress,
          },
        ],
        session,
      },
    );
  });

  tokenCache.addToken(tokenDetails);
  logger.info(`token metadata updated: ${tokenAddress}`);
};

module.exports = {
  fn: consumer,
  jobName: JOB.FETCH_TOKEN_METADATA,
  queueName: QUEUE.TOKEN_PROCESSING,
};
