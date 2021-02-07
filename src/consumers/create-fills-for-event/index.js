const moment = require('moment');
const mongoose = require('mongoose');
const { JOB, QUEUE } = require('../../constants');
const { publishJob } = require('../../queues');
const Event = require('../../model/event');
const getTransactionByHash = require('../../transactions/get-transaction-by-hash');
const processLimitOrderFilledEvent = require('./processors/limit-order-filled');
const processLiquidityProviderSwapEvent = require('./processors/liquidity-provider-swap');
const processRfqOrderFilledEvent = require('./processors/rfq-order-filled');
const processSushiswapSwapEvent = require('./processors/sushiswap-swap');
const processTransformedERC20Event = require('./processors/transformed-erc20');
const processUniswapV2SwapEvent = require('./processors/uniswap-v2-swap');

const createFillsForEvent = async (job, { logger }) => {
  const { eventId } = job.data;

  /*
   * Ensure the specified eventId is valid and that the associated event exists.
   */
  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    throw new Error(`Invalid eventId: ${eventId}`);
  }

  const event = await Event.findById(eventId);

  if (event === null) {
    throw new Error(`Cannot find event: ${eventId}`);
  }

  /**
   * Verify that the associated transaction has been fetched.
   */
  const transaction = await getTransactionByHash(event.transactionHash);

  if (transaction === null) {
    /*
     * If more than 5 minutes have passed since the event was fetched then
     * this might indicate a bottleneck or failure in the transaction fetching job.
     */
    if (moment().diff(event.dateIngested, 'minutes') >= 5) {
      logger.warn(`transaction not found for event: ${event._id}`);
    }

    await publishJob(
      QUEUE.EVENT_PROCESSING,
      JOB.CREATE_FILLS_FOR_EVENT,
      job.data,
      { delay: 30000 },
    );

    return;
  }

  /*
   * Delegate to the correct processor based on event type or throw
   * an error if the event type is unsupported.
   */
  if (event.type === 'LimitOrderFilled') {
    await processLimitOrderFilledEvent(event, transaction, { logger });
    return;
  }

  if (event.type === 'LiquidityProviderSwap') {
    await processLiquidityProviderSwapEvent(event, transaction, { logger });
    return;
  }

  if (event.type === 'RfqOrderFilled') {
    await processRfqOrderFilledEvent(event, transaction, { logger });
    return;
  }

  if (event.type === 'SushiswapSwap') {
    await processSushiswapSwapEvent(event, transaction, { logger });
    return;
  }

  if (event.type === 'TransformedERC20') {
    await processTransformedERC20Event(event, transaction, { logger });
    return;
  }

  if (event.type === 'UniswapV2Swap') {
    await processUniswapV2SwapEvent(event, transaction, { logger });
    return;
  }

  throw new Error(`Unsupported event type: ${event.type}`);
};

module.exports = {
  fn: createFillsForEvent,
  jobName: JOB.CREATE_FILLS_FOR_EVENT,
  queueName: QUEUE.EVENT_PROCESSING,
};
