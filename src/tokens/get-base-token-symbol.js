const { BASE_TOKENS } = require('../constants');

const getBaseTokenSymbol = tokenAddress => {
  const symbol = BASE_TOKENS[tokenAddress];

  if (symbol === undefined) {
    throw new Error(`Token is not a base token: ${tokenAddress}`);
  }

  return symbol;
};

module.exports = getBaseTokenSymbol;
