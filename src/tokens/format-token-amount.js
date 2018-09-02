const _ = require('lodash');
const { ZeroEx } = require('0x.js');
const BigNumber = require('bignumber.js');

module.exports = (amount, token) => {
  if (_.get(token, 'decimals') === undefined) {
    return amount;
  }

  const bigNumber = new BigNumber(amount.toString());

  return ZeroEx.toUnitAmount(bigNumber, token.decimals);
};
