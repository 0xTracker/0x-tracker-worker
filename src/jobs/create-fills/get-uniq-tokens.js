const _ = require('lodash');

const getUniqTokens = (assets, fees) => {
  const tokens = assets
    .map(asset => ({ address: asset.tokenAddress, type: asset.tokenType }))
    .concat(
      fees.map(fee => ({ address: fee.tokenAddress, type: fee.tokenType })),
    );

  const uniqTokens = _(tokens)
    .map(token => token.address)
    .uniq()
    .map(tokenAddress => tokens.find(token => token.address === tokenAddress))
    .value();

  return uniqTokens;
};

module.exports = getUniqTokens;
