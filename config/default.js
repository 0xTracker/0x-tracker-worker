const _ = require('lodash');
const ms = require('ms');

module.exports = {
  bugsnag: {
    token: _.get(process.env, 'BUGSNAG_TOKEN', null),
  },
  database: {
    connectionString: process.env.CONNECTION_STRING,
  },
  ercDex: {
    feeRecipientPollingInterval: ms('1 minute'),
  },
  jobs: {
    createFills: {
      batchSize: 100,
    },
    updateFillStatuses: {
      batchSize: 100,
    },
  },
  maxRetries: {
    default: 10,
  },
  pollingIntervals: {
    default: ms('5 seconds'),
    getNewArticles: ms('1 minute'),
    setRelayerForFills: ms('1 minute'),
  },
  web3: {
    endpoint: `https://mainnet.infura.io/${process.env.INFURA_API_KEY}`,
  },
};
