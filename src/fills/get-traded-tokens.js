const _ = require('lodash');

const formatTokenAmount = require('../tokens/format-token-amount');
const getTradeCountContribution = require('./get-trade-count-contribution');

const fixNaN = value => (_.isNaN(value) ? undefined : value);

const getTradedTokens = fill => {
  const tradedTokens = _(fill.assets)
    .map(asset => {
      const decimals = _.get(asset, 'token.decimals');
      const amount =
        decimals !== undefined
          ? formatTokenAmount(asset.amount, decimals).toNumber()
          : undefined;
      const amountUSD = _.get(asset, 'value.USD');
      const tradeCountContribution = getTradeCountContribution(fill);

      return {
        address: asset.tokenAddress,
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
      tradedAmount: fixNaN(i.tradedAmount),
      tradedAmountUSD: fixNaN(i.tradedAmountUSD),
    }));

  return tradedTokens;
};

module.exports = getTradedTokens;
