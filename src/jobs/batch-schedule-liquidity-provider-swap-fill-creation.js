const { JOB, QUEUE } = require('../constants');
const { publishJob } = require('../queues');
const Event = require('../model/event');

/**
 * Scheduler which finds unprocessed LiquidityProviderSwap events and publishes
 * jobs to create their associated fills. Decoupling scheduling from fill
 * creation ensures that LiquidityProviderSwap events which cannot be processed
 * for some reason don't cause a bottleneck preventing other events from
 * being processed.
 *
 * @param {Object} config
 */
const batchScheduleLiquidityProviderSwapFillCreation = async (
  { batchSize },
  { logger },
) => {
  logger.info(
    `scheduling creation of fills for next ${batchSize} liquidity provider swap events`,
  );

  const events = await Event.find({
    'scheduler.fillCreationScheduled': null,
    type: 'LiquidityProviderSwap',
  })
    .select('_id')
    .limit(batchSize)
    .lean();

  await Promise.all(
    events.map(event =>
      publishJob(
        QUEUE.FILL_PROCESSING,
        JOB.CREATE_LIQUIDITY_PROVIDER_SWAP_EVENT_FILL,
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
    `scheduled creation of fills for ${events.length} liquidity provider swap events`,
  );
};

module.exports = batchScheduleLiquidityProviderSwapFillCreation;
