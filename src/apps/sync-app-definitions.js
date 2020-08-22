const _ = require('lodash');
const Bluebird = require('bluebird');

const { APP_TYPE } = require('../constants');
const { getModel } = require('../model');
// const { JOB, QUEUE } = require('../constants');
// const { publishJob } = require('../queues');
const getAppDefinitions = require('./get-app-definitions');

// TODO: Introduce and test in future PR
// const scheduleBackfill = async appId => {
//   await publishJob(
//     QUEUE.APP_PROCESSING,
//     JOB.BACKFILL_APP,
//     {
//       id: appId,
//     },
//     {
//       jobId: `backfill-app-${appId}`,
//       removeOnComplete: false,
//     },
//   );
// };

const transformMappings = mappings =>
  mappings.map(m => ({
    ...m,
    type: APP_TYPE[m.type.toUpperCase()],
  }));

const createApp = async definition => {
  const App = getModel('App');
  const app = {
    ..._.omit(definition, 'id', 'mappings', 'logo'),
    _id: definition.id,
    logoUrl: `https://cdn.staticaly.com/gh/0xTracker/0x-tracker-worker/master/src/apps/logos/${definition.logo}`,
    mappings: transformMappings(definition.mappings),
  };

  await App.create(app);
  // await scheduleBackfill(definition.id);
};

const compareMappings = (currentMappings, definitionMappings) => {
  const newMappings = _.differenceWith(
    definitionMappings,
    currentMappings,
    _.isEqual,
  );

  const mappingsModified = newMappings.length > 0;

  return mappingsModified;
};

const updateApp = async (app, definition) => {
  const metadata = {
    ..._.omit(definition, 'id', 'mappings', 'logo'),
    logoUrl: `https://cdn.staticaly.com/gh/0xTracker/0x-tracker-worker/master/src/apps/logos/${definition.logo}`,
  };

  Object.keys(metadata).forEach(metadataKey => {
    app.set(metadataKey, metadata[metadataKey]);
  });

  const currentMappings = app.mappings.map(m =>
    _.pickBy(
      _.pick(
        m,
        'affiliateAddress',
        'feeRecipientAddress',
        'takerAddress',
        'type',
      ),
      value => value !== undefined,
    ),
  );

  const nextMappings = transformMappings(definition.mappings);
  const mappingsModified = compareMappings(currentMappings, nextMappings);

  if (mappingsModified) {
    app.set('mappings', nextMappings);
  }

  if (app.isModified()) {
    await app.save();
  }

  // if (mappingsModified) {
  //   await scheduleBackfill(definition.id);
  // }
};

/**
 * Sync current app definitions with MongoDB making sure that any differences
 * in metadata or mappings are reflected in MongoDB.
 *
 * Any changes to definition mappings will trigger an attributions backfill
 * for the app in which the mappings changed.
 *
 * NOTE: Removal of apps or mappings must be handled manually. The sync process
 * is not currently built to automate this since it's unlikely to occur.
 */
const syncAppDefinitions = async () => {
  const App = getModel('App');
  const definitions = getAppDefinitions();

  await Bluebird.each(definitions, async definition => {
    const app = await App.findById(definition.id);

    if (app === null) {
      await createApp(definition);
    } else {
      await updateApp(app, definition);
    }
  });
};

module.exports = syncAppDefinitions;
