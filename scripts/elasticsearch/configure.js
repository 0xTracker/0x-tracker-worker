const dotenv = require('dotenv-safe');
const elasticsearch = require('@elastic/elasticsearch');
const signale = require('signale');

const configureMappings = require('./configure-mappings');
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
Promise.all([
  configureMappings(esClient, logger),
  configureTransforms(esClient, logger),
]).catch(logger.error);
