const _ = require('lodash');
const ms = require('ms');

const aggregationEnabled = process.env.AGGREGATION_ENABLED === 'true';

module.exports = {
  appVersion: _.get(process.env, 'HEROKU_RELEASE_VERSION', null),
  bugsnag: {
    token: _.get(process.env, 'BUGSNAG_TOKEN', null),
  },
  cryptoCompare: {
    apiKey: process.env.CRYPTO_COMPARE_API_KEY,
  },
  database: {
    connectionString: process.env.CONNECTION_STRING,
    poolSize: process.env.POOL_SIZE || 30,
  },
  elasticsearch: {
    password: _.get(process.env, 'ELASTIC_SEARCH_PASSWORD', null),
    url: process.env.ELASTIC_SEARCH_URL,
    username: _.get(process.env, 'ELASTIC_SEARCH_USERNAME', null),
  },
  ercDex: {
    feeRecipientPollingInterval: ms('1 minute'),
  },
  ethplorer: {
    apiKey: process.env.ETHPLORER_API_KEY,
  },
  jobs: {
    aggregateDailyLiquiditySourceMetrics: {
      enabled: aggregationEnabled,
    },
    aggregateDailyNetworkMetrics: {
      enabled: aggregationEnabled,
    },
    aggregateDailyProtocolMetrics: {
      enabled: aggregationEnabled,
    },
    aggregateDailyTokenMetrics: {
      enabled: aggregationEnabled,
    },
    aggregateDailyTraderMetrics: {
      enabled: aggregationEnabled,
    },
    batchScheduleFillCreation: {
      batchSize: 100,
    },
    batchScheduleTransactionFetch: {
      batchSize: 1000,
    },
    createFills: {
      batchSize: 1000,
    },
    deriveFillPrices: {
      batchSize: 100,
    },
    measureFills: {
      batchSize: 1000,
    },
  },
  pollingIntervals: {
    max: {
      default: ms('5 minutes'),
      measureFills: ms('1 minute'),
    },
    min: {
      aggregateDailyLiquiditySourceMetrics: ms('5 minutes'),
      aggregateDailyNetworkMetrics: ms('1 minute'),
      aggregateDailyProtocolMetrics: ms('5 minutes'),
      aggregateDailyTokenMetrics: ms('5 minutes'),
      aggregateDailyTraderMetrics: ms('5 minutes'),
      batchScheduleTransactionFetch: ms('10 seconds'),
      cacheAddressMetrics: ms('1 minute'),
      cacheProtocolMetrics: ms('1 minute'),
      cacheRelayerMetrics: ms('1 minute'),
      cacheTokenMetrics: ms('1 minute'),
      cacheTokenStats: ms('1 minute'),
      default: ms('30 seconds'),
      getMissingTokenImages: ms('1 minute'),
      getNewArticles: ms('10 minutes'),
      precomputeAppStats: ms('5 minutes'),
      resolveTokens: ms('1 minute'),
      updateRelayerStats: ms('1 minute'),
    },
  },
  scheduler: {
    suspended: process.env.SCHEDULER_SUSPENDED === 'true',
  },
  queues: {},
  web3: {
    endpoint: process.env.WEB3_ENDPOINT,
  },
};
