const SYMBOL_MAPPINGS = {
  DAIW: 'DAI',
  ETHW: 'ETH',
  USDTW: 'USDT',
  'VEIL ETH': 'ETH',
  WETH: 'ETH',
};

module.exports = symbol => {
  return SYMBOL_MAPPINGS[symbol] || symbol.toUpperCase();
};
