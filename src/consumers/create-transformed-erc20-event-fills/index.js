const _ = require('lodash');
const { BigNumber } = require('@0x/utils');
const Bluebird = require('bluebird');
const moment = require('moment');
const mongoose = require('mongoose');

const { JOB, QUEUE, FILL_ACTOR, TOKEN_TYPE } = require('../../constants');
const { publishJob } = require('../../queues');
const createFills = require('../../fills/create-fills');
const createNewTokens = require('../../tokens/create-new-tokens');
const Event = require('../../model/event');
const Fill = require('../../model/fill');
const getTransactionByHash = require('../../transactions/get-transaction-by-hash');
const withTransaction = require('../../util/with-transaction');

const createTransformedERC20EventFills = async (job, { logger }) => {
  const { eventId } = job.data;

  /*
   * Ensure the specified eventId is valid and that the associated event exists.
   */
  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    throw new Error(`Invalid eventId: ${eventId}`);
  }

  const transformedERC20Event = await Event.findById(eventId);

  if (transformedERC20Event === null) {
    throw new Error(`Cannot find event: ${eventId}`);
  }

  /*
   * If the transaction contains multiple TransformedERC20 events then we can't process
   * it at the moment. Throw an error to keep the job in the queue for later processing.
   */
  const transformedERC20EventsInTransaction = await Event.countDocuments({
    transactionHash: transformedERC20Event.transactionHash,
    type: transformedERC20Event.type,
  });

  if (transformedERC20EventsInTransaction > 1) {
    throw new Error(
      `Transaction contains multiple TransformedERC20 events: ${transformedERC20Event.transactionHash}`,
    );
  }

  /**
   * Verify that the associated transaction has been fetched. This will indicate whether
   * we also have the associated ERC20BridgeTransfer events captured as well.
   */
  const transaction = await getTransactionByHash(
    transformedERC20Event.transactionHash,
  );

  if (transaction === null) {
    /*
     * If more than 5 minutes have passed since the TransformedERC20 event was fetched then
     * this might indicate a bottleneck or failure in the transaction fetching job.
     */
    if (moment().diff(transformedERC20Event.dateIngested, 'minutes') >= 5) {
      logger.warn(
        `transaction not found for event: ${transformedERC20Event._id}`,
      );
    }

    await publishJob(
      QUEUE.FILL_PROCESSING,
      JOB.CREATE_TRANSFORMED_ERC20_EVENT_FILLS,
      job.data,
      { delay: 30000 },
    );

    return;
  }

  /*
   * Find all of the associated ERC20BridgeTransfer events and total up their
   * maker and taker amounts. Ensure that the total of ERC20BridgeTransfer amounts
   * does not exceed that of the TransformedERC20 event. This is an unexpected
   * scenario so an error will be thrown to ensure the transaction is investigated.
   */
  const bridgeEvents = await Event.find({
    transactionHash: transformedERC20Event.transactionHash,
    type: 'ERC20BridgeTransfer',
  }).lean();

  /*
   * If there are no ERC20BridgeTransfer then the transform would have occurred
   * using traditional fills which will be handled through the standard workflow
   */
  if (bridgeEvents.length === 0) {
    logger.info(
      `TransformedERC20 event has no associated ERC20BridgeTransfer events: ${eventId}`,
    );
    return;
  }

  // const transformMakerAmount = new BigNumber(
  //   transformedERC20Event.data.inputTokenAmount,
  // );
  // const transformTakerAmount = new BigNumber(
  //   transformedERC20Event.data.outputTokenAmount,
  // );

  // const { bridgeMakerAmount, bridgeTakerAmount } = bridgeEvents.reduce(
  //   (acc, current) => ({
  //     bridgeMakerAmount: acc.bridgeMakerAmount.plus(
  //       current.data.fromTokenAmount,
  //     ),
  //     bridgeTakerAmount: acc.bridgeTakerAmount.plus(current.data.toTokenAmount),
  //   }),
  //   {
  //     bridgeMakerAmount: new BigNumber(0),
  //     bridgeTakerAmount: new BigNumber(0),
  //   },
  // );

  // TODO: Potentially this guard needs to be removed
  // if (
  //   bridgeMakerAmount.gt(transformMakerAmount) ||
  //   bridgeTakerAmount.gt(transformTakerAmount)
  // ) {
  //   throw new Error(
  //     `Transaction has TransformedERC20/ERC20BridgeTransfer mismatch: ${event.transactionHash}`,
  //   );
  // }

  // TODO: Should we consider an additional guard which verifies TransformedERC20 tokens match
  // the ERC20BridgeTransfer tokens? Will need special case for ETH.

  /*
   * If the job has made it this far then we're comfortable enough that fill documents can
   * be created for the associated ERC20BridgeTransfer events. We assume that each ERC20BridgeTransfer
   * event is related to the TransformedERC20 event being processed and will use the TransformedERC20
   * event to dictate the token and taker addresses.
   */
  const fills = bridgeEvents.map(bridgeEvent => ({
    _id: bridgeEvent._id,
    affiliateAddress: transaction.affiliateAddress,
    assets: [
      {
        actor: FILL_ACTOR.MAKER,
        amount: new BigNumber(bridgeEvent.data.fromTokenAmount).toNumber(),
        bridgeAddress: bridgeEvent.data.from,
        tokenAddress: bridgeEvent.data.fromToken,
      },
      {
        actor: FILL_ACTOR.TAKER,
        amount: new BigNumber(bridgeEvent.data.toTokenAmount).toNumber(),
        tokenAddress: bridgeEvent.data.toToken,
      },
    ],
    blockHash: transaction.blockHash,
    blockNumber: transaction.blockNumber,
    date: transaction.date,
    eventId: bridgeEvent._id,
    isTransformedERC20: true,
    logIndex: bridgeEvent.logIndex,
    maker: bridgeEvent.data.from,
    protocolVersion: bridgeEvent.protocolVersion,
    quoteDate: transaction.quoteDate,
    taker: transformedERC20Event.data.taker,
    transactionHash: transaction.hash,
  }));

  /*
   * Filter out any fills which have already been created since we need to assume
   * that the job can get run multiple times.
   *
   * https://github.com/OptimalBits/bull#important-notes
   */
  const nonExistantFills = await Bluebird.filter(fills, async fill => {
    const existingFill = await Fill.findOne({ eventId: fill.eventId });

    return existingFill === null;
  });

  if (nonExistantFills.length === 0) {
    logger.warn(`fills for TransformedERC20 event already exist: ${eventId}`);
    return;
  }

  /*
   * Create any tokens which haven't been seen before.
   */
  const uniqTokens = _(nonExistantFills)
    .flatMap(fill => fill.assets.map(asset => asset.tokenAddress))
    .uniq()
    .map(address => ({
      address,
      type: TOKEN_TYPE.ERC20,
    }))
    .value();

  await createNewTokens(uniqTokens);

  /*
    Finally, create fills for the unprocessed ERC20BridgeTransfer events.
  */
  await withTransaction(async session => {
    await createFills(nonExistantFills, { session });
  });

  logger.info(`created fills for TransformedERC20 event: ${eventId}`);
};

module.exports = {
  fn: createTransformedERC20EventFills,
  jobName: JOB.CREATE_TRANSFORMED_ERC20_EVENT_FILLS,
  queueName: QUEUE.FILL_PROCESSING,
};
