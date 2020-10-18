const _ = require('lodash');

const getAllRelayers = require('./get-all-relayers');
const Relayer = require('../model/relayer');

const populateRelayers = async ({ logger }) => {
  logger.info('synchronising relayers collection');

  const relayers = getAllRelayers();
  const operations = _.map(relayers, relayer => ({
    updateOne: {
      filter: { lookupId: relayer.lookupId },
      update: {
        $set: relayer,
      },
      upsert: true,
    },
  }));

  await Relayer.bulkWrite(operations);

  logger.info('relayers collection was synchronised');
};

module.exports = populateRelayers;
