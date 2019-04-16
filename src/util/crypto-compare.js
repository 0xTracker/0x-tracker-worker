const _ = require('lodash');
const axios = require('axios');
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
    logError(error);

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
  const result = await callApi(url);
  const price = _.get(result, 'Data.[1]', null);

  if (price === null) {
    return null;
  }

  return { [symbol]: { USD: price.close } };
};

module.exports = {
  configure,
  getPrice,
};
