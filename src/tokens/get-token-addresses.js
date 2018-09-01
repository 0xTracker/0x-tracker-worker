const { values } = require('lodash');

const { getTokens } = require('./token-cache');

const getTokenAddresses = symbols => {
  const tokens = getTokens();

  return values(tokens)
    .filter(token => symbols.includes(token.symbol))
    .map(token => token.address);
};

module.exports = getTokenAddresses;
