const _ = require('lodash');

const { BASE_TOKENS } = require('../constants');

const getBaseToken = (fill, tokens) => {
  const { makerToken, takerToken } = fill;

  return (
    _(BASE_TOKENS)
      .keys()
      .map(baseToken => {
        if (
          _.has(tokens, makerToken) &&
          tokens[makerToken].address === baseToken
        ) {
          return tokens[makerToken];
        }

        if (
          _.has(tokens, takerToken) &&
          tokens[takerToken].address === baseToken
        ) {
          return tokens[takerToken];
        }

        return null;
      })
      .compact()
      .head() || null
  );
};

module.exports = getBaseToken;
