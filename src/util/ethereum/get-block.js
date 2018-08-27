const bluebird = require('bluebird');
const memoryCache = require('memory-cache');
const ms = require('ms');

const { getClient } = require('./web3');

const getBlock = async blockHash => {
  const cacheKey = `blocks.${blockHash}`;
  const cached = memoryCache.get(cacheKey);

  if (cached !== null) {
    return cached;
  }

  let block;

  const web3GetBlock = bluebird.promisify(getClient().eth.getBlock);

  try {
    block = await web3GetBlock(blockHash);
  } catch (error) {
    return null;
  }

  memoryCache.put(cacheKey, block, ms('1 minute'));

  return block;
};

module.exports = getBlock;
