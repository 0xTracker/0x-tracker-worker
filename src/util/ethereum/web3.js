const ethers = require('ethers');

let wrapper;

const configure = ({ endpoint }) => {
  const provider = new ethers.providers.StaticJsonRpcProvider(endpoint);

  wrapper = provider;
};

/**
 * Get a connected web3 wrapper instance.
 *
 * @returns {Web3Wrapper}
 */
const getWrapper = () => wrapper;

module.exports = { configure, getWrapper };
