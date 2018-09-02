const config = require('config');

const configure = require('./configure');
const ercDexRecipientCache = require('../relayers/erc-dex/recipient-cache');
const populateRelayersCollection = require('../relayers/populate-relayers-collection');
const tokenCache = require('../tokens/token-cache');

const initialise = async () => {
  configure();

  await Promise.all([
    ercDexRecipientCache.loadRecipients().then(() => {
      ercDexRecipientCache.startPolling(
        config.get('ercDex.feeRecipientPollingInterval'),
      );
    }),
    tokenCache.initialise(),
    populateRelayersCollection(),
  ]);
};

module.exports = initialise;
