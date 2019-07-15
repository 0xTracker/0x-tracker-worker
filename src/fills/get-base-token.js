const _ = require('lodash');

const { BASE_TOKENS } = require('../constants');
const { getToken } = require('../tokens/token-cache');

const getBaseToken = fill => {
  const address = _(BASE_TOKENS)
    .keys()
    .find(baseToken => {
      return fill.makerToken === baseToken || fill.takerToken === baseToken;
    });

  if (address === undefined) {
    return null;
  }

  return getToken(address);
};

module.exports = getBaseToken;
