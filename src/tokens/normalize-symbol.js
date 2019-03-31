const { SYMBOL_MAPPINGS } = require('../constants');

module.exports = symbol => {
  return SYMBOL_MAPPINGS[symbol] || symbol.toUpperCase();
};
