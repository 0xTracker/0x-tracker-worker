const _ = require('lodash');
const { BigNumber } = require('@0x/utils');
const { Web3Wrapper } = require('@0x/web3-wrapper');

module.exports = (amount, token) => {
  if (_.get(token, 'decimals') === undefined) {
    return amount;
  }

  const bigNumber = new BigNumber(amount.toString());

  return Web3Wrapper.toUnitAmount(bigNumber, token.decimals);
};
