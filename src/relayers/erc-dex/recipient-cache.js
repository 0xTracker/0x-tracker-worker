const _ = require('lodash');
const axios = require('axios');
const signale = require('signale');

const { logError } = require('../../util/error-logger');

const endpoint = 'https://api.ercdex.com/api/fees/recipients/1';
const logger = signale.scope('erc dex recipient cache');

let recipients = [];

const loadRecipients = async () => {
  const response = await axios.get(endpoint);

  if (_.isArray(response.data)) {
    recipients = response.data;
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

const getRecipients = () => _.clone(recipients);

module.exports = { getRecipients, loadRecipients, startPolling };
