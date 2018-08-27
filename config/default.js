const _ = require('lodash');

module.exports = {
  bugsnag: {
    token: _.get(process.env, 'BUGSNAG_TOKEN', null),
  },
  database: {
    connectionString: process.env.CONNECTION_STRING,
  },
  jobs: {
    createFills: {
      maxChunkSize: 100,
    },
  },
  maxRetries: {
    default: 10,
  },
  pollingIntervals: {
    default: 5000,
    getNewArticles: 60000,
    setRelayerForFills: 60000,
  },
  web3: {
    endpoint: `https://mainnet.infura.io/${process.env.INFURA_API_KEY}`,
  },
};
