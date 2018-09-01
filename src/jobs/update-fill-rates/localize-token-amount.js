const _ = require('lodash');
const { ZeroEx } = require('0x.js');
const BigNumber = require('bignumber.js');

const normalizeSymbol = require('../../tokens/normalize-symbol');

const localizeTokenAmount = (amount, token, rates) => {
  if (!_.isObject(token)) {
    return null;
  }

  const symbol = normalizeSymbol(token.symbol);
  const rate = _.get(rates, [symbol, 'USD']);

  if (!_.isNumber(rate)) {
    return null;
  }

  const bigNumber = new BigNumber(amount.toString());
  const unitAmount = ZeroEx.toUnitAmount(bigNumber, token.decimals);

  return unitAmount.times(rate).toNumber();
};

module.exports = localizeTokenAmount;
