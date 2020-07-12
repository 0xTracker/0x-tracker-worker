const { BASE_TOKENS } = require('../constants');

const baseTokenAddresses = Object.keys(BASE_TOKENS);

const isBaseToken = tokenAddress => {
  return baseTokenAddresses.includes(tokenAddress);
};

module.exports = isBaseToken;
