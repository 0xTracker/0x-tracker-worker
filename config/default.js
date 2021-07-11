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
  jobs: {
    aggregateDailyAppMetrics: {
      enabled: aggregationEnabled,
    },
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
    deriveFillPrices: {
      batchSize: 100,
    },
  },
  pollingIntervals: {
    max: {
      default: ms('5 minutes'),
    },
    min: {
      aggregateDailyAppMetrics: ms('1 minutes'),
      aggregateDailyLiquiditySourceMetrics: ms('1 minutes'),
      aggregateDailyNetworkMetrics: ms('1 minute'),
      aggregateDailyProtocolMetrics: ms('1 minutes'),
      aggregateDailyTokenMetrics: ms('1 minutes'),
      aggregateDailyTraderMetrics: ms('1 minutes'),
      batchScheduleTransactionFetch: ms('10 seconds'),
      default: ms('30 seconds'),
      fetchArticles: ms('10 minutes'),
      getMissingTokenImages: ms('1 minute'),
      precomputeAppStats: ms('5 minutes'),
    },
  },
  scheduler: {
    suspended: process.env.SCHEDULER_SUSPENDED === 'true',
  },
  queues: {
    pricing: {
      limiter: {
        max: 10,
        duration: 1000,
      },
    },
  },
  web3: {
    endpoint: process.env.WEB3_ENDPOINT,
  },
};
