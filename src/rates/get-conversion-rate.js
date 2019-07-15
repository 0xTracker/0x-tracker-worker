const _ = require('lodash');

const getRates = require('./get-rates');

const getConversionRate = async (fromSymbol, toSymbol, date) => {
  const rates = await getRates(fromSymbol, date);

  return _.get(rates, [fromSymbol, toSymbol]);
};

module.exports = getConversionRate;
