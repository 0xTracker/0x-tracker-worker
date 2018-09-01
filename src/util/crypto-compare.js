const _ = require('lodash');
const axios = require('axios');
const moment = require('moment');

const { logError } = require('./error-logger');

const API_ENDPOINT = 'https://min-api.cryptocompare.com/data';

const callApi = async url => {
  let response;

  try {
    response = await axios.get(url);
  } catch (error) {
    logError(error);
    return null;
  }

  // TODO: Log error messages
  if (response.data.Response === 'Error') {
    return null;
  }

  return response.data;
};

module.exports = {
  async getPrice(symbol, date) {
    const timestamp = moment(date).unix();
    const method =
      moment().diff(date, 'day') >= 7 ? 'histohour' : 'histominute';
    const url = `${API_ENDPOINT}/${method}?fsym=${symbol}&tsym=USD&limit=1&toTs=${timestamp}&tryConversion=false`;
    const result = await callApi(url);
    const price = _.get(result, 'Data.[1]', null);

    if (price === null) {
      return null;
    }

    return { [symbol]: { USD: price.close } };
  },
};
