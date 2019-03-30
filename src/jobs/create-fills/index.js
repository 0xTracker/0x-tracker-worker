const bluebird = require('bluebird');
const signale = require('signale');

const {
  MissingBlockError,
  UnsupportedAssetError,
  UnsupportedProtocolError,
} = require('../../errors');
const createFill = require('./create-fill');
const Event = require('../../model/event');

const logger = signale.scope('create fills');

const createFills = async ({ batchSize, processOldestFirst }) => {
  const events = await Event.find({
    fillCreated: { $in: [false, null] },
  })
    .sort({ blockNumber: processOldestFirst ? 1 : -1 })
    .limit(batchSize);

  logger.info(`found ${events.length} events without associated fills`);

  await bluebird.mapSeries(events, async event => {
    logger.pending(
      `creating fill for log #${event.logIndex} of ${event.transactionHash}`,
    );

    try {
      await createFill(event);

      logger.success(
        `created fill for log #${event.logIndex} of ${event.transactionHash}`,
      );
    } catch (error) {
      if (error instanceof MissingBlockError) {
        logger.warn(
          `Unable to create fill for event ${event.id} due to missing block`,
        );
      } else if (error instanceof UnsupportedAssetError) {
        logger.warn(
          `Unable to create fill for event ${
            event.id
          } due to unsupported asset`,
        );
      } else if (error instanceof UnsupportedProtocolError) {
        logger.warn(
          `Unable to create fill for event ${
            event.id
          } due to unsupported protocol`,
        );
      } else {
        throw error;
      }
    }
  });
};

module.exports = createFills;
