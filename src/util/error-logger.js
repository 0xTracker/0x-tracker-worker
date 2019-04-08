const _ = require('lodash');
const bugsnag = require('bugsnag');
const signale = require('signale');

let useBugsnag = false;

const logger = signale.scope('application');

const logError = (error, metaData) => {
  if (useBugsnag) {
    bugsnag.notify(error, { metaData });
  }

  logger.error(error);
};

const configure = ({ appVersion, bugsnagToken }) => {
  if (_.isString(bugsnagToken)) {
    bugsnag.register(bugsnagToken, { appVersion });
    useBugsnag = true;
  } else {
    process.on('uncaughtException', logger.error);
    process.on('unhandledRejection', logger.error);
  }
};

module.exports = {
  configure,
  logError,
};
