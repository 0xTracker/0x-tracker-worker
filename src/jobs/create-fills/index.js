const bluebird = require('bluebird');
const signale = require('signale');

const { UnsupportedAssetError } = require('../../errors');
const createFill = require('./create-fill');
const getTransactionByHash = require('../../transactions/get-transaction-by-hash');
const getUnprocessedEvents = require('./get-unprocessed-events');
const markEventProcessed = require('./mark-event-processed');

const logger = signale.scope('create fills');

const createFills = async ({ batchSize }) => {
  const events = await getUnprocessedEvents(batchSize);

  logger.info(`found ${events.length} pending events`);

  await bluebird.each(events, async event => {
    logger.info(`creating fill for event ${event.id}`);

    const transaction = await getTransactionByHash(event.transactionHash);

    if (transaction === null) {
      logger.warn(`transaction not found: ${event.transactionHash}`);
      return;
    }

    try {
      await createFill(event, transaction);
      await markEventProcessed(event._id);
      logger.info(`created fill for event ${event.id}`);
    } catch (error) {
      if (error instanceof UnsupportedAssetError) {
        logger.warn(
          `Unable to create fill for event ${event.id} due to unsupported asset`,
        );
      } else {
        throw error;
      }
    }
  });
};

module.exports = createFills;
