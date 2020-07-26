const config = require('config');

const { QUEUE } = require('../constants');
const { initQueues } = require('../queues');
const configure = require('./configure');
const populateRelayersCollection = require('../relayers/populate-relayers-collection');
const syncAppDefinitions = require('../apps/sync-app-definitions');
const tokenCache = require('../tokens/token-cache');

const initialise = async () => {
  await configure();
  initQueues(Object.values(QUEUE), config.get('queues'));

  await Promise.all([
    populateRelayersCollection(),
    syncAppDefinitions(),
    tokenCache.initialise(),
  ]);
};

module.exports = initialise;
