require('dotenv-safe').config({
  example:
    process.env.NODE_ENV === 'production'
      ? '.env.prod.example'
      : '.env.example',
});

const config = require('config');
const signale = require('signale');

const add = require('./add');
const logger = require('./util/logger');

logger.configure({
  bugsnagToken: config.get('bugsnag.token'),
});

signale.log(`1+1 = ${add(1, 1)}`);
