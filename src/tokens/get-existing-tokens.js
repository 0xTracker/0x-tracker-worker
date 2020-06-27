const { getModel } = require('../model');

const getExistingTokens = async addresses => {
  const Token = getModel('Token');
  const existingTokens = await Token.find({
    address: { $in: addresses },
  }).select('address');

  return existingTokens.map(token => token.address);
};

module.exports = getExistingTokens;
