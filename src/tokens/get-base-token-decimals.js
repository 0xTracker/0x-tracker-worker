const { BASE_TOKEN_DECIMALS } = require('../constants');

const getBaseTokenDecimals = tokenAddress => {
  const decimals = BASE_TOKEN_DECIMALS[tokenAddress];

  if (decimals === undefined) {
    throw new Error(`Token is not a base token: ${tokenAddress}`);
  }

  return decimals;
};

module.exports = getBaseTokenDecimals;
