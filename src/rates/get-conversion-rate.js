const _ = require('lodash');

const { logError } = require('../util/error-logger');
const getRates = require('./get-rates');

const getConversionRate = async (fromSymbol, toSymbol, date) => {
  const rates = await getRates(fromSymbol, date);
  const conversionRate = _.get(rates, [fromSymbol, toSymbol]);

  if (conversionRate === undefined) {
    logError(
      `Unable to fetch conversion rate from ${fromSymbol} to ${toSymbol} on ${date}`,
      {
        rates,
      },
    );
  }

  return conversionRate;
};

module.exports = getConversionRate;
