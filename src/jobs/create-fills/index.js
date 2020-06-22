const bluebird = require('bluebird');
const signale = require('signale');

const {
  MissingBlockError,
  UnsupportedAssetError,
  UnsupportedFeeError,
  UnsupportedProtocolError,
} = require('../../errors');
const createFill = require('./create-fill');
const getUnprocessedEvents = require('../../events/get-unprocessed-events');

const logger = signale.scope('create fills');

const createFills = async ({ batchSize }) => {
  const events = await getUnprocessedEvents(batchSize);

  logger.info(`found ${events.length} pending events`);

  await bluebird.each(events, async event => {
    logger.info(`creating fill for event ${event.id}`);

    try {
      await createFill(event);
      logger.info(`created fill for event ${event.id}`);
    } catch (error) {
      if (error instanceof MissingBlockError) {
        logger.warn(
          `Unable to create fill for event ${event.id} due to missing block`,
        );
      } else if (error instanceof UnsupportedAssetError) {
        logger.warn(
          `Unable to create fill for event ${event.id} due to unsupported asset`,
        );
      } else if (error instanceof UnsupportedProtocolError) {
        logger.warn(
          `Unable to create fill for event ${event.id} due to unsupported protocol`,
        );
      } else if (error instanceof UnsupportedFeeError) {
        logger.warn(
          `Unable to create fill for event ${event.id} due to unsupported fee`,
        );
      } else {
        throw error;
      }
    }
  });
};

module.exports = createFills;
