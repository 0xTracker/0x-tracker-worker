const memoryCache = require('memory-cache');
const ms = require('ms');

const web3 = require('./web3');

const getBlock = async blockHash => {
  const cacheKey = `blocks.${blockHash}`;
  const cached = memoryCache.get(cacheKey);

  if (cached !== null) {
    return cached;
  }

  const block = await web3.getWrapper().getBlockIfExistsAsync(blockHash);

  if (block === undefined) {
    return null;
  }

  memoryCache.put(cacheKey, block, ms('1 minute'));

  return block;
};

module.exports = getBlock;
