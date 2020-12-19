const memoryCache = require('memory-cache');
const ms = require('ms');

const web3 = require('./web3');

const getBlock = async blockHash => {
  const cacheKey = `blocks.${blockHash}`;
  const cached = memoryCache.get(cacheKey);

  if (cached !== null) {
    return cached;
  }

  const web3Wrapper = web3.getWrapper();

  const timeout = new Promise((resolve, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      reject(new Error(`Fetching block ${blockHash} timed out after 10s`));
    }, 10000);
  });

  const block = await Promise.race([web3Wrapper.getBlock(blockHash), timeout]);

  if (block === undefined) {
    return null;
  }

  memoryCache.put(cacheKey, block, ms('1 minute'));

  return block;
};

module.exports = getBlock;
