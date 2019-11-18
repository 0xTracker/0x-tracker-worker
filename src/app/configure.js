const config = require('config');

const { createModels } = require('../model');
const cryptoCompare = require('../util/crypto-compare');
const db = require('../util/db');
const errorLogger = require('../util/error-logger');
const ethplorer = require('../util/ethplorer');
const web3 = require('../util/ethereum/web3');

const configure = () => {
  errorLogger.configure({
    appVersion: config.get('appVersion'),
    bugsnagToken: config.get('bugsnag.token'),
  });
  db.connect(config.get('database.connectionString'), {
    poolSize: config.get('database.poolSize'),
  });
  web3.configure({ endpoint: config.get('web3.endpoint') });
  ethplorer.configure({ apiKey: config.get('ethplorer.apiKey') });
  cryptoCompare.configure({ apiKey: config.get('cryptoCompare.apiKey') });
  createModels({ elasticsearchUrl: config.get('elasticsearch.url') });
};

module.exports = configure;
