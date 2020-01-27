const _ = require('lodash');
const axios = require('axios');

const { logError } = require('./error-logger');

let apiKey;

const configure = config => {
  apiKey = config.apiKey; // eslint-disable-line prefer-destructuring
};

const getTokenInfo = async address => {
  const endpoint = `https://api.ethplorer.io/getTokenInfo/${address}?apiKey=${apiKey}`;
  let response;

  try {
    response = await axios.get(endpoint);
  } catch (error) {
    logError(error, { requestUrl: endpoint.replace(apiKey, '[REDACTED]') });

    throw error;
  }

  const { data } = response;

  if (data.error) {
    if (data.error.code !== 150) {
      logError(
        `Error occurred when calling ${endpoint}:\r\n\r\n${data.error.message}`,
      );
    }

    return null;
  }

  if (_.isEmpty(data.name) || _.isEmpty(data.symbol)) {
    return null;
  }

  return {
    address: data.address,
    decimals: _.toNumber(data.decimals),
    name: data.name,
    symbol: data.symbol.toUpperCase(),
  };
};

module.exports = { configure, getTokenInfo };
