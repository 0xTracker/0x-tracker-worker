const _ = require('lodash');

const Token = require('../model/token');

let keyedTokens = {};

const initialise = async ({ logger }) => {
  const loadedTokens = await Token.find({
    resolved: { $in: [null, true] },
  }).lean();

  keyedTokens = _.keyBy(loadedTokens, 'address');
  logger.info(`initialised token cache with ${loadedTokens.length} tokens`);
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
