const _ = require('lodash');
const Bluebird = require('bluebird');

const { getModel } = require('../model');
const getFeedDefinitions = require('./get-feed-definitions');

const createEntity = async definition => {
  const ArticleFeed = getModel('ArticleFeed');
  const feed = {
    ..._.omit(definition, 'id'),
    _id: definition.id,
  };

  await ArticleFeed.create(feed);
};

const updateEntity = async (feed, definition) => {
  const metadata = {
    ..._.omit(definition, 'id'),
  };

  Object.keys(metadata).forEach(metadataKey => {
    feed.set(metadataKey, metadata[metadataKey]);
  });

  const modified = feed.isModified();

  if (modified) {
    await feed.save();
  }

  return modified;
};

/**
 * Sync current feed definitions with MongoDB making sure that any differences
 * in metadata are reflected in MongoDB.
 *
 * NOTE: Removal of feeds must be handled manually. The sync process
 * is not currently built to automate this since it's unlikely to occur.
 */
const syncFeedDefinitions = async ({ logger }) => {
  logger.info('synchronising feed definitions');

  const ArticleFeed = getModel('ArticleFeed');
  const definitions = getFeedDefinitions();

  await Bluebird.each(definitions, async definition => {
    const entity = await ArticleFeed.findById(definition.id);

    if (entity === null) {
      await createEntity(definition);
      logger.info(`created ${definition.name} feed definition`);
    } else if (await updateEntity(entity, definition)) {
      logger.info(`updated ${definition.name} feed definition`);
    } else {
      logger.info(`${definition.name} feed definition was untouched`);
    }
  });

  logger.info('synchronised feed definitions');
};

module.exports = syncFeedDefinitions;
