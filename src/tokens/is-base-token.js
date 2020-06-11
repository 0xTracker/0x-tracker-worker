const { BASE_TOKENS } = require('../constants');

const isBaseToken = tokenAddress => {
  return BASE_TOKENS[tokenAddress] !== undefined;
};

module.exports = isBaseToken;
