// Load environment variables from .env in development and throw an
// error if any required variables are missing in production
require('dotenv-safe').config({
  example:
    process.env.NODE_ENV === 'production'
      ? '.env.prod.example'
      : '.env.example',
});

const config = require('config');

const { getJobs } = require('./jobs');
const { runJobs } = require('./util/job-runner');
const db = require('./util/db');
const errorLogger = require('./util/error-logger');

errorLogger.configure({
  bugsnagToken: config.get('bugsnag.token'),
});
db.connect(config.get('database.connectionString'));

const jobs = getJobs({
  maxRetries: config.get('maxRetries'),
  pollingIntervals: config.get('pollingIntervals'),
});

runJobs(jobs, {
  onError: (retriesRemaining, error) => {
    errorLogger.logError(error);
  },
}).catch(errorLogger.logError);
