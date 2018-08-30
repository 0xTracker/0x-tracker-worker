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
const ercDexRecipientCache = require('./relayers/erc-dex/recipient-cache');
const errorLogger = require('./util/error-logger');
const ethplorer = require('./util/ethplorer');
const tokenCache = require('./tokens/token-cache');
const web3 = require('./util/ethereum/web3');

errorLogger.configure({
  bugsnagToken: config.get('bugsnag.token'),
});
db.connect(config.get('database.connectionString'));
web3.configure({ endpoint: config.get('web3.endpoint') });
ethplorer.configure({ apiKey: config.get('ethplorer.apiKey') });

const jobs = getJobs({
  maxRetries: config.get('maxRetries'),
  pollingIntervals: config.get('pollingIntervals'),
});

Promise.all([
  ercDexRecipientCache.loadRecipients().then(() => {
    ercDexRecipientCache.startPolling(
      config.get('ercDex.feeRecipientPollingInterval'),
    );
  }),
  tokenCache.initialise(),
])
  .then(() => {
    runJobs(jobs, {
      onError: (retriesRemaining, error) => {
        errorLogger.logError(error);
      },
    });
  })
  .catch(errorLogger.logError);
