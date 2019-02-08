const _ = require('lodash');
const ms = require('ms');

module.exports = {
  appVersion: _.get(process.env, 'HEROKU_RELEASE_VERSION', null),
  bugsnag: {
    token: _.get(process.env, 'BUGSNAG_TOKEN', null),
  },
  database: {
    connectionString: process.env.CONNECTION_STRING,
  },
  ercDex: {
    feeRecipientPollingInterval: ms('1 minute'),
  },
  ethplorer: {
    apiKey: process.env.ETHPLORER_API_KEY,
  },
  jobs: {
    createFills: {
      batchSize: 100,
      processOldestFirst: true,
    },
    updateFillPrices: {
      batchSize: 250,
      processOldestFirst: true,
    },
    updateFillRates: {
      batchSize: 100,
      processOldestFirst: true,
    },
    updateFillStatuses: {
      batchSize: 100,
      processOldestFirst: true,
    },
  },
  maxRetries: {
    default: 10,
  },
  pollingIntervals: {
    default: ms('5 seconds'),
    getMissingTokenImages: ms('1 minute'),
    getNewArticles: ms('1 minute'),
    setRelayerForFills: ms('1 minute'),
    updateTokenStats: ms('1 minute'),
  },
  web3: {
    endpoint: `https://mainnet.infura.io/${process.env.INFURA_API_KEY}`,
  },
};
