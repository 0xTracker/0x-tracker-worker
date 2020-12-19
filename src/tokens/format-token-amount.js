const _ = require('lodash');
const { BigNumber } = require('@0x/utils');

const toUnitAmount = (amount, decimals) => {
  const aUnit = new BigNumber(10).pow(decimals);
  const unit = amount.div(aUnit);
  return unit;
};

module.exports = (amount, tokenOrDecimals) => {
  const decimals = _.isNumber(tokenOrDecimals)
    ? tokenOrDecimals
    : _.get(tokenOrDecimals, 'decimals');

  if (decimals === undefined) {
    return amount;
  }

  const bigNumber = new BigNumber(amount.toString());

  return toUnitAmount(bigNumber, decimals);
};
