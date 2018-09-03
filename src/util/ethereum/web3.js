const {
  RPCSubprovider,
  Web3ProviderEngine,
} = require('@0xproject/subproviders');
const { Web3Wrapper } = require('@0xproject/web3-wrapper');

let client;

const configure = ({ endpoint }) => {
  const providerEngine = new Web3ProviderEngine();

  providerEngine.addProvider(new RPCSubprovider(endpoint));
  providerEngine.start();

  client = new Web3Wrapper(providerEngine);
};

const getClient = () => client;

module.exports = { configure, getClient };
