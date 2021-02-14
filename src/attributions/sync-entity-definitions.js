const _ = require('lodash');
const Bluebird = require('bluebird');

const { FILL_ATTRIBUTION_TYPE } = require('../constants');
const { getModel } = require('../model');
// const { JOB, QUEUE } = require('../constants');
// const { publishJob } = require('../queues');
const getEntityDefinitions = require('./get-entity-definitions');

// TODO: Introduce and test in future PR
// const scheduleBackfill = async entityId => {
//   await publishJob(
//     QUEUE.APP_PROCESSING,
//     JOB.BACKFILL_ATTRIBUTION_ENTITY,
//     {
//       id: entityId,
//     },
//     {
//       jobId: `backfill-attribution-entity-${entityId}`,
//       removeOnComplete: false,
//     },
//   );
// };

const transformMappings = mappings =>
  mappings.map(m => ({
    ...m,
    type: FILL_ATTRIBUTION_TYPE[m.type.toUpperCase()],
  }));

const createEntity = async definition => {
  const AttributionEntity = getModel('AttributionEntity');
  const entity = {
    ..._.omit(definition, 'id', 'mappings', 'logo'),
    _id: definition.id,
    logoUrl: `https://cdn.staticaly.com/gh/0xTracker/0x-tracker-worker/master/src/attributions/logos/${definition.logo}`,
    mappings: transformMappings(definition.mappings),
  };

  await AttributionEntity.create(entity);
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

const updateEntity = async (entity, definition) => {
  const metadata = {
    ..._.omit(definition, 'id', 'mappings', 'logo'),
    logoUrl: `https://cdn.staticaly.com/gh/0xTracker/0x-tracker-worker/master/src/attributions/logos/${definition.logo}`,
  };

  Object.keys(metadata).forEach(metadataKey => {
    entity.set(metadataKey, metadata[metadataKey]);
  });

  const currentMappings = entity.mappings.map(m =>
    _.pickBy(
      _.pick(
        m,
        'affiliateAddress',
        'feeRecipientAddress',
        'senderAddress',
        'takerAddress',
        'transactionToAddress',
        'type',
      ),
      value => value !== undefined,
    ),
  );

  const nextMappings = transformMappings(definition.mappings);
  const mappingsModified = compareMappings(currentMappings, nextMappings);

  if (mappingsModified) {
    entity.set('mappings', nextMappings);
  }

  const modified = entity.isModified();

  if (modified) {
    await entity.save();
  }

  return modified;

  // if (mappingsModified) {
  //   await scheduleBackfill(definition.id);
  // }
};

/**
 * Sync current entity definitions with MongoDB making sure that any differences
 * in metadata or mappings are reflected in MongoDB.
 *
 * NOTE: Removal of attribution entities must be handled manually. The sync process
 * is not currently built to automate this since it's unlikely to occur.
 */
const syncEntityDefinitions = async ({ logger }) => {
  logger.info('synchronising attribution entity definitions');

  const AttributionEntity = getModel('AttributionEntity');
  const definitions = getEntityDefinitions();

  await Bluebird.each(definitions, async definition => {
    const entity = await AttributionEntity.findById(definition.id);

    if (entity === null) {
      await createEntity(definition);
      logger.info(`created ${definition.name} attribution entity definition`);
    } else if (await updateEntity(entity, definition)) {
      logger.info(`updated ${definition.name} attribution entity definition`);
    } else {
      logger.info(
        `${definition.name} attribution entity definition was untouched`,
      );
    }
  });

  logger.info('synchronised attribution entity definitions');
};

module.exports = syncEntityDefinitions;
