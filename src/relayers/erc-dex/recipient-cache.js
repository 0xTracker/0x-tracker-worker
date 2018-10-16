const _ = require('lodash');
const axios = require('axios');
const signale = require('signale');

const { logError } = require('../../util/error-logger');

const endpoint = 'https://app.ercdex.com/api/v2/fee_recipients';
const logger = signale.scope('erc dex recipient cache');

let cachedRecipients = [];

const loadRecipients = async () => {
  const response = await axios.get(endpoint);
  const recipients = _.get(response, 'data.records');

  if (_.isArray(recipients)) {
    cachedRecipients = recipients;
  } else {
    logError(
      `Invalid response received when fetching ERC dEX fee recipients:\r\n\r\n${response}`,
    );
  }

  logger.info('updated ERC dEX fee recipients');
};

const startPolling = interval => {
  setInterval(
    () =>
      loadRecipients().catch(error => {
        logError(error);
      }),
    interval,
  );
};

const getRecipients = () => _.clone(cachedRecipients);

module.exports = { getRecipients, loadRecipients, startPolling };
