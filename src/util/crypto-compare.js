const _ = require('lodash');
const axios = require('axios');
const bluebird = require('bluebird');
const moment = require('moment');

const { logError } = require('./error-logger');

const API_ENDPOINT = 'https://min-api.cryptocompare.com/data';

let apiKey = '';

const configure = config => {
  apiKey = config.apiKey; // eslint-disable-line prefer-destructuring
};

const callApi = async url => {
  let response;

  try {
    response = await axios.get(url);
  } catch (error) {
    logError(error, { requestUrl: url.replace(apiKey, '[REDACTED]') });

    return null;
  }

  if (response.data.Response === 'Error') {
    logError('Error when calling CryptoCompare API', {
      response,
    });

    return null;
  }

  return response.data;
};

const getPrice = async (symbol, date) => {
  const timestamp = moment(date).unix();
  const method = moment().diff(date, 'day') >= 7 ? 'histohour' : 'histominute';
  const url = `${API_ENDPOINT}/${method}?fsym=${symbol}&tsym=USD&limit=1&toTs=${timestamp}&tryConversion=false&api_key=${apiKey}`;
  const responseData = await callApi(url);
  const price = _.get(responseData, 'Data.[1].close', null);

  // The Cryptocompare API rate limits at 20 requests per second. We artificially
  // limit to 10 requests per second (one every one hundred milliseconds) to be safe.
  await bluebird.delay(100);

  if (price === null) {
    logError(`Unable to get USD price of ${symbol} on ${date}`, {
      responseData,
    });
    return null;
  }

  return { [symbol]: { USD: price } };
};

module.exports = {
  configure,
  getPrice,
};
