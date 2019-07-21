const _ = require('lodash');

const { getToken } = require('../../tokens/token-cache');
const formatTokenAmount = require('../../tokens/format-token-amount');

const getPricesForFill = fill => {
  const value = _.get(fill, 'conversions.USD.amount', null);

  if (value === null) {
    return null;
  }

  const makerToken = getToken(fill.makerToken);
  const takerToken = getToken(fill.takerToken);

  if (_.some([makerToken, takerToken], _.isUndefined)) {
    return null;
  }

  const makerAmount = formatTokenAmount(fill.makerAmount, makerToken);
  const takerAmount = formatTokenAmount(fill.takerAmount, takerToken);

  return {
    maker: {
      USD: value / makerAmount,
    },
    taker: {
      USD: value / takerAmount,
    },
  };
};

module.exports = getPricesForFill;
