const _ = require('lodash');
const { BigNumber } = require('@0x/utils');

const { getToken } = require('../../tokens/token-cache');
const formatTokenAmount = require('../../tokens/format-token-amount');

const deriveTokenPriceFromFill = fill => {
  const value = _.get(fill, 'conversions.USD.amount', null);

  if (value === 0) {
    return null;
  }

  if (value === null) {
    // We should not be attempting to derive from unmeasured fills.
    // This would indicate an issue in the fetch-unpriced-fills query.
    throw new Error(`Fill ${fill._id} has not been measured`);
  }

  const unpricedAssets = fill.assets.filter(
    asset => _.get(asset, 'price.USD', null) === null,
  );

  if (unpricedAssets.length === 0) {
    // We should not be attempting to derive from fills without unpriced assets.
    // This would indicate an issue in the fetch-unpriced-fills query.
    throw new Error(`Fill ${fill._id} has no unpriced assets`);
  }

  if (_.uniqBy(unpricedAssets, asset => asset.actor).length > 1) {
    // The fill is in an invalid state if it has unpriced assets on both sides
    // but also has its value set.
    throw new Error(`Fill ${fill._id} has unpriced assets for both actors`);
  }

  const unpricedTokens = _.uniqBy(unpricedAssets, asset => asset.tokenAddress);

  if (unpricedTokens.length > 1) {
    // Price cannot be derived if there are multiple types of unpriced assets because
    // we cannot determine which portion of the fill value belongs to which asset.
    return null;
  }

  const unpricedAsset = unpricedAssets[0];
  const unpricedToken = getToken(unpricedAsset.tokenAddress);

  if (unpricedToken === undefined) {
    // If we cannot get the token details then it isn't possible to decode the token
    // amount and calculate a price. This would indicate that either the fill is in
    // an invalid state or the fetch-unpriced-fills query is broken.
    throw new Error(
      `Fill ${fill._id} relies on unresolved token ${unpricedAsset.tokenAddress}`,
    );
  }

  // We calculate the price based on the total amount of unpriced assets. All of
  // these assets belong to the same token, which means the total amount will equal
  // 100% of the fill value.
  const unpricedTotal = unpricedAssets.reduce(
    (accumulator, asset) => accumulator.plus(asset.amount),
    new BigNumber(0),
  );

  const formattedAmount = formatTokenAmount(unpricedTotal, unpricedToken);
  const price = value / formattedAmount;

  return {
    price: {
      USD: price,
    },
    tokenAddress: unpricedToken.address,
  };
};

module.exports = deriveTokenPriceFromFill;
