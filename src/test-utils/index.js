const { MongoMemoryReplSet } = require('mongodb-memory-server');

const { getModels, initModels } = require('../model');
const db = require('../util/db');

const replSet = new MongoMemoryReplSet({
  replSet: { storageEngine: 'wiredTiger' },
});

/**
 * Reset the in-memory test database to a clean state.
 */
const resetDb = async () => {
  const models = getModels();

  await Promise.all(
    Object.values(models).map(async model => {
      await model.collection.drop();
      await model.createCollection();
    }),
  );
};

/**
 * Initialize an in-memory test database containing
 * all the app's required collections.
 */
const setupDb = async () => {
  await replSet.waitUntilRunning();
  const uri = await replSet.getUri();
  await db.connect(uri);
  await initModels();
};

/**
 * Tear down the in-memory test database.
 */
const tearDownDb = () => {
  db.disconnect();
  replSet.stop();
};

module.exports = { resetDb, setupDb, tearDownDb };
