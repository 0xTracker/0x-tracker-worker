const _ = require('lodash');

module.exports = {
  bugsnag: {
    token: _.get(process.env, 'BUGSNAG_TOKEN', null),
  },
};
