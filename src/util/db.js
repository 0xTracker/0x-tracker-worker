const mongoose = require('mongoose');
const signale = require('signale');

const { logError } = require('./error-logger');

const logger = signale.scope('mongodb');

mongoose.Promise = global.Promise;

module.exports = {
  connect: (connectionString, options = {}) => {
    mongoose.connect(connectionString, {
      poolSize: options.poolSize,
    });

    mongoose.connection.on('connected', () => {
      logger.success('database connection established');
    });

    mongoose.connection.on('error', err => {
      logError(err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('database connection terminated');
    });
  },
  disconnect: () => {
    mongoose.disconnect();
  },
};
