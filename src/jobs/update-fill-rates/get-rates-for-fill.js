const _ = require('lodash');

const { BASE_TOKENS } = require('../../constants');
const getRates = require('../../rates/get-rates');

const getRatesForFill = async fill => {
  const symbolsForRates = [fill.makerToken, fill.takerToken]
    .filter(tokenAddress => _.has(BASE_TOKENS, tokenAddress))
    .map(tokenAddress => BASE_TOKENS[tokenAddress])
    .concat('ZRX');

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
