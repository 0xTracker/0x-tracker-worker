const { BigNumber } = require('@0x/utils');
const moment = require('moment');
const mongoose = require('mongoose');
const signale = require('signale');

const { JOB, QUEUE } = require('../../constants');
const { publishJob } = require('../../queues');
const Event = require('../../model/event');
const getTransactionByHash = require('../../transactions/get-transaction-by-hash');

const logger = signale.scope('create fills for transformed erc-20 event');

const createTransformedERC20EventFills = async job => {
  const { eventId } = job.data;

  /**
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
   * If the transaction contains multiple TransformedERC20 events then we can't process
   * it at the moment. Throw an error to keep the job in the queue for later processing.
   */
  const transformedERC20EventsInTransaction = await Event.count({
    transactionHash: event.transactionHash,
    type: event.type,
  });

  if (transformedERC20EventsInTransaction > 1) {
    throw new Error(
      `Transaction contains multiple TransformedERC20 events: ${event.transactionHash}`,
    );
  }

  /**
   * Verify that the associated transaction has been fetched. This will indicate whether
   * we also have the associated ERC20BridgeTransfer events captured as well.
   */
  const transaction = await getTransactionByHash(event.transactionHash);

  if (transaction === null) {
    if (moment().diff(event.dateIngested, 'minutes') > 5) {
      logger.warn(`transaction not found for event: ${event._id}`);
    }

    await publishJob(
      QUEUE.FILL_PROCESSING,
      JOB.CREATE_TRANSFORMED_ERC20_EVENT_FILLS,
      job.data,
      { delay: 30000 },
    );

    return;
  }

  /**
   * Find all of the associated ERC20BridgeTransfer events and total up their
   * maker and taker amounts. Ensure that the total of ERC20BridgeTransfer amounts
   * does not exceed that of the TransformedERC20 event. This is an unexpected
   * scenario so an error will be thrown to ensure the transaction is investigated.
   */
  const bridgeEvents = await Event.find({
    transactionHash: event.transactionHash,
    type: 'ERC20BridgeTransfer',
  }).lean();

  const transformMakerAmount = new BigNumber(event.data.inputTokenAmount);
  const transformTakerAmount = new BigNumber(event.data.outputTokenAmount);

  const { bridgeMakerAmount, bridgeTakerAmount } = bridgeEvents.reduce(
    (acc, current) => ({
      bridgeMakerAmount: acc.bridgeMakerAmount.plus(
        current.data.fromTokenAmount,
      ),
      bridgeTakerAmount: acc.bridgeTakerAmount.plus(current.data.toTokenAmount),
    }),
    {
      bridgeMakerAmount: new BigNumber(0),
      bridgeTakerAmount: new BigNumber(0),
    },
  );

  if (
    bridgeMakerAmount.gt(transformMakerAmount) ||
    bridgeTakerAmount.gt(transformTakerAmount)
  ) {
    throw new Error(
      `Transaction has TransformedERC20/ERC20BridgeTransfer mismatch: ${event.transactionHash}`,
    );
  }

  // TODO: Should we consider an additional guard which verifies TransformedERC20 tokens match
  // the ERC20BridgeTransfer tokens? Will need special case for ETH.

  /**
   * If the job has made it this far then we're comfortable enough that fill documents can
   * be created for the associated ERC20BridgeTransfer events. We assume that each ERC20BridgeTransfer
   * event is related to the TransformedERC20 event being processed and will use the TransformedERC20
   * event to dictate the token and taker addresses.
   */
  logger.info(`saul good man: ${event._id}`);
  // Create a fill document
  // Schedule post-creation jobs

  logger.info(`created fills for TransformedERC20 event: ${eventId}`);
};

module.exports = {
  fn: createTransformedERC20EventFills,
  jobName: JOB.CREATE_TRANSFORMED_ERC20_EVENT_FILLS,
  queueName: QUEUE.FILL_PROCESSING,
};
