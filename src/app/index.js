const configure = require('./configure');
const initialise = require('./initialise');
const start = require('./start');

const app = {
  configure,
  initialise,
  start,
};

module.exports = app;
