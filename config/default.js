const _ = require('lodash');

module.exports = {
  bugsnag: {
    token: _.get(process.env, 'BUGSNAG_TOKEN', null),
  },
  database: {
    connectionString: process.env.CONNECTION_STRING,
  },
  maxRetries: {
    default: 10,
  },
  pollingIntervals: {
    default: 5000,
    getNewArticles: 60000,
  },
};
