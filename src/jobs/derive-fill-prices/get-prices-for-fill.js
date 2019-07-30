const _ = require('lodash');

const { getToken } = require('../../tokens/token-cache');
const formatTokenAmount = require('../../tokens/format-token-amount');

const getPricesForFill = fill => {
  const value = _.get(fill, 'conversions.USD.amount', null);

  // Guard against assets being incorrectly flagged with hasValue=true
  if (value === null) {
    return null;
  }

  // Guard against assets being incorrectly flagged with tokenResolved=true
  if (
    _.some(fill.assets, asset => getToken(asset.tokenAddress) === undefined)
  ) {
    return null;
  }

  const pricedAssets = _.map(fill.assets, asset => {
    const token = getToken(asset.tokenAddress);
    const tokenAmount = formatTokenAmount(asset.amount, token);
    const price = value / tokenAmount;

    return {
      price: {
        USD: price,
      },
      tokenAddress: asset.tokenAddress,
    };
  });

  return pricedAssets;
};

module.exports = getPricesForFill;
