const _ = require('lodash');
const signale = require('signale');

const Fill = require('../model/fill');
const getAllRelayers = require('../relayers/get-all-relayers');

const logger = signale.scope('set relayer for fills');

const backfillRelayerRelationships = async () => {
  const relayers = getAllRelayers();

  const results = await Promise.all(
    _.values(relayers).map(relayer => {
      const query = _.compact([
        { relayerId: null },
        relayer.feeRecipients && {
          feeRecipient: { $in: relayer.feeRecipients },
        },
        relayer.takerAddresses && { taker: { $in: relayer.takerAddresses } },
      ]);

      return Fill.updateMany(_.merge({}, ...query), {
        $set: { relayerId: relayer.lookupId },
      });
    }),
  );

  const modifiedCount = results.reduce(
    (acc, result) => acc + result.nModified,
    0,
  );

  if (modifiedCount === 0) {
    logger.info('relayer did not need setting for any fills');
  } else {
    logger.success(`set relayer for ${modifiedCount} fills`);
  }
};

module.exports = backfillRelayerRelationships;
