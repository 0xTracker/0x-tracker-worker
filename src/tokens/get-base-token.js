const { BASE_TOKENS, BASE_TOKEN_DECIMALS } = require('../constants');

const getBaseToken = tokenAddress => {
  const symbol = BASE_TOKENS[tokenAddress];

  if (symbol === undefined) {
    return null;
  }

  return {
    address: tokenAddress,
    decimals: BASE_TOKEN_DECIMALS[tokenAddress],
    symbol,
  };
};

module.exports = getBaseToken;
