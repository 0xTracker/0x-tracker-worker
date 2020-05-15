const _ = require('lodash');

const formatTokenAmount = require('../tokens/format-token-amount');

const fixNaN = value => (_.isNaN(value) ? undefined : value);

const calculateTradeCountContribution = fill => {
  const isOrderMatcher = _.get(fill, 'relayer.orderMatcher', false);

  if (isOrderMatcher) {
    return 0.5;
  }

  return 1;
};

const getTradedTokens = fill => {
  const tradedTokens = _(fill.assets)
    .map(asset => {
      const decimals = _.get(asset, 'token.decimals');
      const amount =
        decimals !== undefined
          ? formatTokenAmount(asset.amount, decimals).toNumber()
          : undefined;
      const amountUSD = _.get(asset, 'value.USD');
      const tradeCountContribution = calculateTradeCountContribution(fill);

      return {
        address: asset.tokenAddress,
        filledAmount: amount,
        filledAmountUSD: amountUSD,
        priceUSD: _.get(asset, 'price.USD'),
        tradeCountContribution,
        tradedAmount: amount * tradeCountContribution,
        tradedAmountUSD: amountUSD * tradeCountContribution,
        type: _.get(asset, 'token.type'),
      };
    })
    .reduce((acc, value) => {
      const existing = acc.find(i => i.address === value.address);

      if (existing) {
        return acc.map(i =>
          i.address === value.address
            ? {
                ...i,
                filledAmount: i.filledAmount + value.filledAmount,
                filledAmountUSD: i.filledAmountUSD + value.filledAmountUSD,
                tradedAmount: i.tradedAmount + value.tradedAmount,
                tradedAmountUSD: i.tradedAmountUSD + value.tradedAmountUSD,
              }
            : i,
        );
      }

      return [...acc, value];
    }, [])
    .map(i => ({
      ...i,
      filledAmount: fixNaN(i.filledAmount),
      filledAmountUSD: fixNaN(i.filledAmountUSD),
      tradedAmount: fixNaN(i.tradedAmount),
      tradedAmountUSD: fixNaN(i.tradedAmountUSD),
    }));

  return tradedTokens;
};

module.exports = getTradedTokens;
