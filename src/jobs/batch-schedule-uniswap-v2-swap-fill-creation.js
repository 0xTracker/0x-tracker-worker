const { JOB, QUEUE } = require('../constants');
const { publishJob } = require('../queues');
const Event = require('../model/event');

/**
 * Scheduler which finds unprocessed UniswapV2Swap events and publishes
 * jobs to create their associated fills. Decoupling scheduling from fill
 * creation ensures that UniswapV2Swap events which cannot be processed
 * for some reason don't cause a bottleneck preventing other events from
 * being processed.
 *
 * @param {Object} config
 */
const batchScheduleUniswapV2SwapFillCreation = async (
  { batchSize },
  { logger },
) => {
  logger.info(
    `scheduling creation of fills for next ${batchSize} uniswap v2 swap events`,
  );

  const events = await Event.find({
    'scheduler.fillCreationScheduled': null,
    type: 'UniswapV2Swap',
  })
    .select('_id')
    .limit(batchSize)
    .lean();

  await Promise.all(
    events.map(event =>
      publishJob(
        QUEUE.EVENT_PROCESSING,
        JOB.CREATE_UNISWAP_V2_SWAP_EVENT_FILL,
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
    `scheduled creation of fills for ${events.length} uniswap v2 swap events`,
  );
};

module.exports = batchScheduleUniswapV2SwapFillCreation;
