const dotenv = require('dotenv-safe');
const elasticsearch = require('@elastic/elasticsearch');
const signale = require('signale');

const createIndexes = require('./create-indexes');
const configureMappings = require('./configure-mappings');
const configureSettings = require('./configure-settings');
const configureTransforms = require('./configure-transforms');

const logger = signale.scope('configure elasticsearch');

// Load environment variables from .env
dotenv.config();

// Create elasticsearch connection
const esClient = new elasticsearch.Client({
  node: process.env.ELASTIC_SEARCH_URL,
  auth: {
    username: process.env.ELASTIC_SEARCH_USERNAME,
    password: process.env.ELASTIC_SEARCH_PASSWORD,
  },
});

// Run configuration
createIndexes(esClient, logger)
  .then(() => {
    return Promise.all([
      configureMappings(esClient, logger),
      configureTransforms(esClient, logger),
      configureSettings(esClient, logger),
    ]);
  })
  .catch(logger.error);
