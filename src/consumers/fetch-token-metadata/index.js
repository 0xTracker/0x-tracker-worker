const _ = require('lodash');
const ms = require('ms');
const signale = require('signale');

const { JOB, QUEUE } = require('../../constants');
const { getModel } = require('../../model');
const fetchTokenMetadata = require('../../tokens/fetch-token-metadata');
const persistTokenMetadata = require('./persist-token-metadata');
const resolveToken = require('../../tokens/resolve-token');

const tokenCache = require('../../tokens/token-cache');
const withTransaction = require('../../util/with-transaction');

const logger = signale.scope('resolve token');

const consumer = async job => {
  const { tokenAddress, tokenType } = job.data;

  logger.info(`attempting to fetch token metadata: ${tokenAddress}`);

  const resolvedToken = await resolveToken(tokenAddress, tokenType);

  if (resolvedToken === null) {
    logger.warn(`token metadata not found: ${tokenAddress}`);
    await fetchTokenMetadata(tokenAddress, tokenType, ms('1 hour'));
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
  jobName: JOB.INDEX_FILL,
  queueName: QUEUE.FILL_INDEXING,
};
