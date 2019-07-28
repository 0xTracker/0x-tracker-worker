const _ = require('lodash');
const bluebird = require('bluebird');
const signale = require('signale');

const { getTokenInfo } = require('../util/ethplorer');
const Fill = require('../model/fill');
const Token = require('../model/token');
const tokenCache = require('../tokens/token-cache');
const withTransaction = require('../util/with-transaction');

const logger = signale.scope('resolve tokens');

const resolveTokens = async () => {
  const unresolvedTokens = await Token.find({ resolved: false }).lean();

  if (unresolvedTokens.length === 0) {
    logger.info('no unresolved tokens were found');
    return;
  }

  logger.pending(
    `fetching details of ${unresolvedTokens.length} unresolved tokens`,
  );

  await bluebird.mapSeries(unresolvedTokens, async token => {
    const { address } = token;
    const resolvedToken = await getTokenInfo(address);

    if (resolvedToken === null) {
      logger.warn(`no token info found for ${address}`);
      await bluebird.delay(3000);
      return;
    }

    const tokenDetails = _.pick(resolvedToken, [
      'address',
      'decimals',
      'name',
      'symbol',
    ]);

    await withTransaction(async session => {
      await Token.updateOne(
        { address },
        { $set: { ...tokenDetails, resolved: true } },
        { session },
      );
      await Fill.updateMany(
        {
          'assets.tokenAddress': address,
        },
        {
          $set: {
            'assets.$[element].tokenResolved': true,
          },
        },
        {
          arrayFilters: [
            {
              'element.tokenAddress': address,
            },
          ],
          session,
        },
      );
    });

    logger.success(`resolved token details for ${resolvedToken.symbol}`);
    tokenCache.addToken(tokenDetails);

    await bluebird.delay(3000);
  });
};

module.exports = resolveTokens;
