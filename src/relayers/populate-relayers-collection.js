const _ = require('lodash');
const signale = require('signale');

const getAllRelayers = require('./get-all-relayers');
const Relayer = require('../model/relayer');

const logger = signale.scope('populate relayers');

const populateRelayers = async () => {
  logger.pending('populating relayers collection');

  const relayers = getAllRelayers();
  const operations = _.map(relayers, ({ lookupId }) => ({
    updateOne: {
      filter: { lookupId },
      update: {
        $set: {
          lookupId,
        },
      },
      upsert: true,
    },
  }));

  await Relayer.bulkWrite(operations);

  logger.success('relayers collection was populated');
};

module.exports = populateRelayers;
