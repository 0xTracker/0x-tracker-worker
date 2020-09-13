const AddressMetadata = require('./address-metadata');
const AddressMetric = require('./address-metric');
const App = require('./app');
const Article = require('./article');
const Event = require('./event');
const Fill = require('./fill');
const MetricsJobMetadata = require('./metrics-job-metadata');
const Relayer = require('./relayer');
const Token = require('./token');
const Transaction = require('./transaction');

let models;

const getModel = name => {
  if (models === undefined) {
    throw new Error(
      'Cannot get model before models have been initialized. Must call initModels first.',
    );
  }

  if (models[name] === undefined) {
    throw new Error(`${name} model doesn't exist.`);
  }

  return models[name];
};

const getModels = () => {
  if (models === undefined) {
    throw new Error(
      'Cannot get models before they have been initialized. Must call initModels first.',
    );
  }

  return models;
};

const initModels = async () => {
  if (models !== undefined) {
    throw new Error('Models have already been initialized.');
  }

  models = {
    AddressMetadata,
    AddressMetric,
    App,
    Article,
    Event,
    Fill,
    MetricsJobMetadata,
    Relayer,
    Token,
    Transaction,
  };

  await Promise.all(
    Object.values(models).map(async model => {
      await model.createCollection();
    }),
  );
};

module.exports = { getModel, getModels, initModels };
