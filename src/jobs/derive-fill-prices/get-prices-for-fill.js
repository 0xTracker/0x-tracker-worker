const _ = require('lodash');

const formatTokenAmount = require('../../tokens/format-token-amount');

const getPricesForFill = (fill, tokens) => {
  const localisedAmount = _.get(fill, 'conversions.USD.amount', null);

  if (localisedAmount === null) {
    return null;
  }

  const makerToken = tokens[fill.makerToken];
  const takerToken = tokens[fill.takerToken];

  if (_.some([makerToken, takerToken], _.isUndefined)) {
    return null;
  }

  const makerAmount = formatTokenAmount(fill.makerAmount, makerToken);
  const takerAmount = formatTokenAmount(fill.takerAmount, takerToken);

  return {
    maker: {
      token: takerAmount.dividedBy(makerAmount),
      localised: {
        USD: localisedAmount / makerAmount,
      },
    },
    taker: {
      token: makerAmount.dividedBy(takerAmount),
      localised: {
        USD: localisedAmount / takerAmount,
      },
    },
  };
};

module.exports = getPricesForFill;
