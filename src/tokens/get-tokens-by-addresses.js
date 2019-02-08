const _ = require('lodash');

const Token = require('../model/token');

const getTokensByAddresses = async addresses => {
  if (addresses.length === 0) {
    return {};
  }

  const tokens = await Token.find({ address: { $in: addresses } });

  return _.keyBy(tokens, 'address');
};

module.exports = getTokensByAddresses;
