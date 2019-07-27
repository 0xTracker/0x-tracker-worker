const _ = require('lodash');

const { BASE_TOKENS } = require('../constants');
const { getToken } = require('../tokens/token-cache');

const getBaseToken = fill => {
  const address = _(BASE_TOKENS)
    .keys()
    .find(tokenAddress => _.some(fill.assets, { tokenAddress }));

  if (address === undefined) {
    return null;
  }

  return getToken(address);
};

module.exports = getBaseToken;
