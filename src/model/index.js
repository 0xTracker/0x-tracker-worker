const AddressMetric = require('./address-metric');
const Article = require('./article');
const createFillModel = require('./fill');
const Event = require('./event');
const MetricsJobMetadata = require('./metrics-job-metadata');
const Relayer = require('./relayer');
const Token = require('./token');

const models = {
  AddressMetric,
  Article,
  Event,
  MetricsJobMetadata,
  Relayer,
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

const init = async () => {
  createModels();

  await models.Article.createCollection();
  await models.Fill.createCollection();
  await models.Relayer.createCollection();
  await models.Token.createCollection();
};

module.exports = { getModel, init };
