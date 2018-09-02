const config = require('config');

const db = require('../util/db');
const errorLogger = require('../util/error-logger');
const ethplorer = require('../util/ethplorer');
const web3 = require('../util/ethereum/web3');

const configure = () => {
  errorLogger.configure({
    bugsnagToken: config.get('bugsnag.token'),
  });
  db.connect(config.get('database.connectionString'));
  web3.configure({ endpoint: config.get('web3.endpoint') });
  ethplorer.configure({ apiKey: config.get('ethplorer.apiKey') });
};

module.exports = configure;
