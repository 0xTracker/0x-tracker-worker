const signale = require('signale');

const { JOB, QUEUE } = require('../constants');
const { publishJob } = require('../queues');
const Event = require('../model/event');

const logger = signale.scope('batch schedule transaction fetch');

/**
 * Scheduler which finds unprocessed TransformedERC20 events and publishes
 * jobs to create their associated fills. Decoupling scheduling from fill
 * creation ensures that TransformedERC20 events which cannot be processed
 * for some reason don't cause a bottleneck preventing other events from
 * being processed.
 *
 * TODO: Port this methodology over to standard fill creation
 *
 * @param {Object} config
 */
const batchScheduleTransformedERC20FillCreation = async ({ batchSize }) => {
  logger.info(
    `scheduling creation of fills for next ${batchSize} transformed erc-20 events`,
  );

  const events = await Event.find({
    'scheduler.fillCreationScheduled': null,
    type: 'TransformedERC20',
  })
    .select('_id')
    .limit(batchSize)
    .lean();

  await Promise.all(
    events.map(event =>
      publishJob(
        QUEUE.FILL_PROCESSING,
        JOB.CREATE_TRANSFORMED_ERC20_EVENT_FILLS,
        {
          eventId: event._id,
        },
      ),
    ),
  );

  await Event.updateMany(
    {
      _id: { $in: events.map(event => event._id) },
    },
    { $set: { 'scheduler.fillCreationScheduled': true } },
  );

  logger.info(
    `scheduled creation of fills for ${events.length} transformed erc-20 events`,
  );
};

module.exports = batchScheduleTransformedERC20FillCreation;
