const { RPCSubprovider, Web3ProviderEngine } = require('@0x/subproviders');
const { Web3Wrapper } = require('@0x/web3-wrapper');
const { providerUtils } = require('@0x/utils');

let wrapper;

const configure = ({ endpoint }) => {
  const providerEngine = new Web3ProviderEngine();

  providerEngine.addProvider(new RPCSubprovider(endpoint));
  providerUtils.startProviderEngine(providerEngine);

  wrapper = new Web3Wrapper(providerEngine);
};

/**
 * Get a connected web3 wrapper instance.
 *
 * @returns {Web3Wrapper}
 */
const getWrapper = () => wrapper;

module.exports = { configure, getWrapper };
