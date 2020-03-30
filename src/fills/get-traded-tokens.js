const _ = require('lodash');

const formatTokenAmount = require('../tokens/format-token-amount');

const getTradedTokens = fill => {
  const tradedTokens = _(fill.assets).map(asset => {
    const decimals = _.get(asset, 'token.decimals');
    const amount =
      decimals !== undefined
        ? formatTokenAmount(asset.amount, decimals)
        : undefined;

    return {
      address: asset.tokenAddress,
      amount,
      amountUSD: _.get(asset, 'value.USD'),
      priceUSD: _.get(asset, 'price.USD'),
      tokenType: _.get(asset, 'token.type'),
    };
  });

  return tradedTokens;
};

module.exports = getTradedTokens;
