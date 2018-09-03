const _ = require('lodash');
const { BigNumber } = require('@0xproject/utils');
const { Web3Wrapper } = require('@0xproject/web3-wrapper');

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

  const unitAmount = Web3Wrapper.toUnitAmount(
    new BigNumber(baseTokenAmount),
    baseToken.decimals,
  );
  const localisedAmount = unitAmount.times(conversionRate).toNumber();

  return localisedAmount;
};

module.exports = getLocalisedAmount;
