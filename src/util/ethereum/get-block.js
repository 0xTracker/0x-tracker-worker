const memoryCache = require('memory-cache');
const ms = require('ms');

const web3 = require('./web3');

const getBlock = async blockHash => {
  const cacheKey = `blocks.${blockHash}`;
  const cached = memoryCache.get(cacheKey);

  if (cached !== null) {
    return cached;
  }

  let block;

  try {
    block = await web3.getClient().getBlockAsync(blockHash);
  } catch (error) {
    return null;
  }

  memoryCache.put(cacheKey, block, ms('1 minute'));

  return block;
};

module.exports = getBlock;
