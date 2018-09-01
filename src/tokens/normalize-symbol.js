module.exports = symbol => (symbol === 'WETH' ? 'ETH' : symbol.toUpperCase());
