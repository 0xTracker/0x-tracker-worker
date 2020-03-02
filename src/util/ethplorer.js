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
    const errorCode = _.get(error.response, 'data.error.code');
    const errorMsg = _.get(error.response, 'data.error.message');

    if (errorCode === 104 || errorCode === 150) {
      return null;
    }

    if (errorMsg !== undefined) {
      const wrappedError = new Error(`Error fetching token info: ${errorMsg}`);

      logError(wrappedError, {
        requestUrl: endpoint.replace(apiKey, '[REDACTED]'),
      });

      throw wrappedError;
    }

    logError(error, { requestUrl: endpoint.replace(apiKey, '[REDACTED]') });

    throw error;
  }

  const { data } = response;

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
