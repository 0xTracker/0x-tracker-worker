const _ = require('lodash');
const axios = require('axios');

const { logError } = require('./error-logger');
const formatTokenAmount = require('../tokens/format-token-amount');

const ETHPLORER_ERROR_CODES = {
  INVALID_ADDRESS_FORMAT: 104,
  NOT_TOKEN_CONTRACT: 150,
};

let apiKey;

const configure = config => {
  apiKey = config.apiKey; // eslint-disable-line prefer-destructuring
};

const normalizeTotalSupply = (totalSupply, decimals) => {
  if (
    !_.isFinite(decimals) ||
    (!_.isString(totalSupply) && !_.isNumber(totalSupply))
  ) {
    return undefined;
  }

  return formatTokenAmount(totalSupply, decimals).toNumber();
};

const getTokenInfo = async address => {
  const endpoint = `https://api.ethplorer.io/getTokenInfo/${address}?apiKey=${apiKey}`;
  let response;

  try {
    response = await axios.get(endpoint);
  } catch (error) {
    const errorCode = _.get(error.response, 'data.error.code');
    const errorMsg = _.get(error.response, 'data.error.message');

    if (
      errorCode === ETHPLORER_ERROR_CODES.INVALID_ADDRESS_FORMAT ||
      errorCode === ETHPLORER_ERROR_CODES.NOT_TOKEN_CONTRACT
    ) {
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

  const name =
    _.isString(data.name) && data.name.length > 0 ? data.name : undefined;

  const decimals =
    _.isString(data.decimals) || _.isFinite(data.decimals)
      ? _.toNumber(data.decimals)
      : undefined;

  const symbol =
    _.isString(data.symbol) && data.symbol.length > 0
      ? data.symbol.toUpperCase()
      : undefined;

  const totalSupply = normalizeTotalSupply(data.totalSupply, decimals);
  const availableSupply = _.get(data, 'price.availableSupply');

  const circulatingSupply =
    _.isFinite(availableSupply) || _.isString(availableSupply)
      ? _.toNumber(availableSupply)
      : undefined;

  return {
    address,
    circulatingSupply: circulatingSupply > 0 ? circulatingSupply : undefined,
    decimals,
    name,
    symbol,
    totalSupply: totalSupply > 0 ? totalSupply : undefined,
  };
};

module.exports = { configure, getTokenInfo };
