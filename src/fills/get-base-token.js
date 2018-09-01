const _ = require('lodash');

const { BASE_TOKENS } = require('../constants');

const getBaseToken = (fill, tokens) => {
  const { makerToken, takerToken } = fill;

  return (
    _(BASE_TOKENS)
      .map(baseToken => {
        if (
          _.has(tokens, makerToken) &&
          tokens[makerToken].symbol === baseToken
        ) {
          return tokens[makerToken];
        }

        if (
          _.has(tokens, takerToken) &&
          tokens[takerToken].symbol === baseToken
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
