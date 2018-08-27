const bluebird = require('bluebird');
const config = require('config');
const signale = require('signale');

const createFill = require('./create-fill');
const Event = require('../../model/event');
const MissingBlockError = require('./missing-block-error');

const logger = signale.scope('create fills');

const createFills = async () => {
  const maxChunkSize = config.get('jobs.createFills.maxChunkSize');
  const events = await Event.find({
    fillCreated: { $in: [false, null] },
    protocolVersion: 1,
  })
    .sort({ blockNumber: -1 })
    .limit(maxChunkSize);

  logger.info(`found ${events.length} events without associated fills`);

  try {
    await bluebird.mapSeries(events, async event => {
      logger.pending(
        `creating fill for log #${event.logIndex} of ${event.transactionHash}`,
      );

      await createFill(event);

      logger.success(
        `created fill for log #${event.logIndex} of ${event.transactionHash}`,
      );
    });
  } catch (error) {
    if (error instanceof MissingBlockError) {
      logger.warn(`unable to create fill due to missing block`);
    } else {
      throw error;
    }
  }
};

module.exports = createFills;
