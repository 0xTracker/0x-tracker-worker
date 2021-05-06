const cache = require('memory-cache');
const moment = require('moment');

require('moment-round');

const { getPrice } = require('../util/crypto-compare');

const getRates = async (fromSymbol, date) => {
  const cacheKey = `rates.historical.${fromSymbol}`;
  const fromCache = cache.get(cacheKey);
  const roundedDate = (moment().diff(date, 'days') >= 7
    ? moment.utc(date).floor(1, 'hour')
    : moment.utc(date).floor(1, 'minute')
  ).toDate();

  if (fromCache && moment(fromCache.date).isSame(roundedDate)) {
    return fromCache.rates;
  }

  const rates = await getPrice(fromSymbol, roundedDate);

  if (rates !== null) {
    cache.put(cacheKey, {
      date: roundedDate,
      rates,
    });
  }

  return rates;
};

module.exports = getRates;
