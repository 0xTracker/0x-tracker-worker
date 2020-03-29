const _ = require('lodash');
const signale = require('signale');

const Token = require('../model/token');

let keyedTokens = {};

const logger = signale.scope('token cache');

const initialise = async tokens => {
  if (tokens === undefined) {
    const loadedTokens = await Token.find({
      resolved: { $in: [null, true] },
    }).lean();

    keyedTokens = _.keyBy(loadedTokens, 'address');
    logger.success(
      `initialised token cache with ${loadedTokens.length} tokens`,
    );
  } else {
    keyedTokens = _.keyBy(tokens, 'address');
  }
};

const getTokens = () => _.clone(keyedTokens);

const getToken = tokenAddress => _.clone(keyedTokens[tokenAddress]);

const addToken = token => {
  keyedTokens[token.address] = token;
};

const checkTokenResolved = tokenAddress => {
  return _.has(keyedTokens, tokenAddress);
};

module.exports = {
  addToken,
  checkTokenResolved,
  getToken,
  getTokens,
  initialise,
};
