const config = require('config');
const signale = require('signale');

const { QUEUE } = require('../constants');
const { initQueues } = require('../queues');
const configure = require('./configure');
const populateRelayersCollection = require('../relayers/populate-relayers-collection');
const syncEntityDefinitions = require('../attributions/sync-entity-definitions');
const syncFeedDefinitions = require('../feeds/sync-feed-definitions');
const tokenCache = require('../tokens/token-cache');

const initialise = async () => {
  await configure();

  initQueues(Object.values(QUEUE), config.get('queues'));

  const logger = signale.scope('app');

  await Promise.all([
    populateRelayersCollection({ logger }),
    syncEntityDefinitions({ logger }),
    syncFeedDefinitions({ logger }),
    tokenCache.initialise({ logger }),
  ]);
};

module.exports = initialise;
