const _ = require('lodash');

const { getModel } = require('../../model');
const tokenCache = require('../../tokens/token-cache');
const withTransaction = require('../../util/with-transaction');

const persisTokenMetadata = async (tokenAddress, tokenMetadata) => {
  const token = await getModel('Token').findOne({ address: tokenAddress });

  // This error may indicate that the token document has not replicated
  // across all MongoDB replicas yet.
  if (_.isNil(token)) {
    throw new Error(`Could not find token in MongoDB: ${tokenAddress}`);
  }

  if (
    tokenMetadata.circulatingSupply !== null &&
    tokenMetadata.circulatingSupply !== token.circulatingSupply
  ) {
    token.set('circulatingSupply', tokenMetadata.circulatingSupply);
  }

  if (
    tokenMetadata.totalSupply !== null &&
    tokenMetadata.totalSupply !== token.totalSupply
  ) {
    token.set('totalSupply', tokenMetadata.totalSupply);
  }

  // Only update decimals if its not already been set since it should never change.
  if (_.isNil(token.decimals) && tokenMetadata.decimals !== null) {
    token.set('decimals', tokenMetadata.decimals);
    token.set('resolved', true);
  }

  // Don't update name if already set. This allows for manual changes in the DB.
  if (_.isNil(token.name) && tokenMetadata.name !== null) {
    token.set('name', tokenMetadata.name);
  }

  // Don't update symbol if already set. This allows for manual changes in the DB.
  if (_.isNil(token.symbol) && tokenMetadata.symbol !== null) {
    token.set('symbol', tokenMetadata.symbol);
  }

  // If nothing has changed then we can bail out early
  if (!token.isModified()) {
    return [];
  }

  const modifiedFields = [
    'circulatingSupply',
    'decimals',
    'name',
    'symbol',
    'totalSupply',
  ].filter(field => token.isModified(field));

  await withTransaction(async session => {
    await token.save({ session });

    if (!modifiedFields.includes('decimals')) {
      return;
    }

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

    tokenCache.addToken(token.toObject());
  });

  return modifiedFields;
};

module.exports = persisTokenMetadata;
