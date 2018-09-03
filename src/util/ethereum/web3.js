const {
  RPCSubprovider,
  Web3ProviderEngine,
} = require('@0xproject/subproviders');
const { Web3Wrapper } = require('@0xproject/web3-wrapper');

let wrapper;

const configure = ({ endpoint }) => {
  const providerEngine = new Web3ProviderEngine();

  providerEngine.addProvider(new RPCSubprovider(endpoint));
  providerEngine.start();

  wrapper = new Web3Wrapper(providerEngine);
};

const getWrapper = () => wrapper;

module.exports = { configure, getWrapper };
