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
      await model.deleteMany({});
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
const tearDownDb = async () => {
  await db.disconnect();
  await replSet.stop();
};

const mockLogger = {
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
};

module.exports = { mockLogger, resetDb, setupDb, tearDownDb };
