const _ = require('lodash');
const signale = require('signale');

const endpoint = 'https://api.ercdex.com/api/fees/recipients/1';
const logger = signale.scope('caching');

let recipients = [];

const loadRecipients = async () => {
  const response = await fetch(endpoint);

  recipients = await response.json();

  logger.info('[zrx-tracker] updated ERC dEX fee recipients');
};

const startPolling = async interval => {
  setInterval(loadRecipients, interval);
};

const getRecipients = () => _.clone(recipients);

module.exports = { getRecipients, loadRecipients, startPolling };
