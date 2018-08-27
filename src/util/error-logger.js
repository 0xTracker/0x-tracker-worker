const _ = require('lodash');
const bugsnag = require('bugsnag');
const signale = require('signale');

let useBugsnag = false;

const logger = signale.scope('application');

const logError = error => {
  if (useBugsnag) {
    bugsnag.notify(error);
  }

  logger.error(error);
};

const configure = ({ bugsnagToken }) => {
  if (_.isString(bugsnagToken)) {
    bugsnag.register(bugsnagToken);
    useBugsnag = true;
  }

  process.on('uncaughtException', logError);
  process.on('unhandledRejection', logError);
};

module.exports = {
  configure,
  logError,
};
