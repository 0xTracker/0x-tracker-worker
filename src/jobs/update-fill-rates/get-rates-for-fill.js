const _ = require('lodash');
const { compact, flow, map } = require('lodash/fp');

const { BASE_TOKENS } = require('../../constants');
const getRates = require('../../rates/get-rates');
const normalizeSymbol = require('../../tokens/normalize-symbol');

const getSymbolsForFill = (fill, tokens) => {
  const symbols = flow(
    compact,
    map(normalizeSymbol),
  )([
    _.get(tokens, `${fill.makerToken}.symbol`),
    _.get(tokens, `${fill.takerToken}.symbol`),
    'ZRX',
  ]);

  return symbols;
};

const getRatesForFill = async (fill, tokens) => {
  const baseTokenSymbols = _(BASE_TOKENS)
    .values()
    .uniq()
    .value();
  const fillSymbols = getSymbolsForFill(fill, tokens);
  const symbolsForRates = _.intersection(
    ['ZRX', ...baseTokenSymbols],
    fillSymbols.map(normalizeSymbol),
  );

  const rates = await Promise.all(
    symbolsForRates.map(symbol => getRates(symbol, fill.date)),
  );
  const combinedRates = _.merge({}, ...rates);

  if (_.keys(combinedRates).length !== symbolsForRates.length) {
    return null;
  }

  return combinedRates;
};

module.exports = getRatesForFill;
