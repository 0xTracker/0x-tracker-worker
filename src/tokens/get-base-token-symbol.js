const { BASE_TOKENS } = require('../constants');

const getBaseTokenSymbol = tokenAddress => {
  const decimals = BASE_TOKENS[tokenAddress];

  if (decimals === undefined) {
    throw new Error(`Could not get symbol for base token: ${tokenAddress}`);
  }
};

module.exports = getBaseTokenSymbol;
