const { BASE_TOKEN_DECIMALS } = require('../constants');

const getBaseTokenDecimals = tokenAddress => {
  const decimals = BASE_TOKEN_DECIMALS[tokenAddress];

  if (decimals === undefined) {
    throw new Error(`Could not get decimals for base token: ${tokenAddress}`);
  }
};

module.exports = getBaseTokenDecimals;
