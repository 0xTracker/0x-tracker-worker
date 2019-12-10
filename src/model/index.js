const AddressMetric = require('./address-metric');
const Article = require('./article');
const createFillModel = require('./fill');
const Event = require('./event');
const MetricsJobMetadata = require('./metrics-job-metadata');
const RelayerMetric = require('./relayer-metric');
const Relayer = require('./relayer');
const TokenMetric = require('./token-metric');
const Token = require('./token');

const models = {
  AddressMetric,
  Article,
  Event,
  MetricsJobMetadata,
  RelayerMetric,
  Relayer,
  TokenMetric,
  Token,
};

const createModels = () => {
  models.Fill = createFillModel();
};

const getModel = name => {
  if (models === undefined) {
    throw new Error(`No ${name} model found.`);
  }

  return models[name];
};

module.exports = { createModels, getModel };
