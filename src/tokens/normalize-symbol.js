const _ = require('lodash');

module.exports = symbol =>
  _.includes(['WETH', 'VEIL ETH'], symbol) ? 'ETH' : symbol.toUpperCase();
