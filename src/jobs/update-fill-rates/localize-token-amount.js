const _ = require('lodash');
const { BigNumber } = require('@0xproject/utils');
const { Web3Wrapper } = require('@0xproject/web3-wrapper');

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
  const unitAmount = Web3Wrapper.toUnitAmount(bigNumber, token.decimals);

  return unitAmount.times(rate).toNumber();
};

module.exports = localizeTokenAmount;
