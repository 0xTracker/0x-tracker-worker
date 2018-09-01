const _ = require('lodash');
const { ZeroEx } = require('0x.js');

const getBaseToken = require('../../fills/get-base-token');
const getTokenAmount = require('../../fills/get-token-amount');
const normalizeSymbol = require('../../tokens/normalize-symbol');

const getLocalisedAmount = (fill, tokens, rates) => {
  const baseToken = getBaseToken(fill, tokens);

  if (baseToken === null) {
    return null;
  }

  const baseTokenAmount = getTokenAmount(baseToken, fill);
  const baseTokenSymbol = normalizeSymbol(baseToken.symbol);
  const conversionRate = _.get(rates, `${baseTokenSymbol}.USD`);

  if (_.isUndefined(conversionRate)) {
    return null;
  }

  const unitAmount = ZeroEx.toUnitAmount(baseTokenAmount, baseToken.decimals);
  const localisedAmount = unitAmount.times(conversionRate).toNumber();

  return localisedAmount;
};

module.exports = getLocalisedAmount;
