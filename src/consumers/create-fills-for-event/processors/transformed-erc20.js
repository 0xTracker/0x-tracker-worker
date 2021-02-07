const _ = require('lodash');
const { BigNumber } = require('@0x/utils');
const Bluebird = require('bluebird');
const {
  JOB,
  QUEUE,
  FILL_ACTOR,
  FILL_TYPE,
  TOKEN_TYPE,
} = require('../../../constants');
const { publishJob } = require('../../../queues');
const createFills = require('../../../fills/create-fills');
const createNewTokens = require('../../../tokens/create-new-tokens');
const Event = require('../../../model/event');
const Fill = require('../../../model/fill');
const withTransaction = require('../../../util/with-transaction');

const dedupeBridgeEvents = events => {
  return _.uniqWith(events, (a, b) => _.isEqual(a.data, b.data));
};

const processTransformedERC20Event = async (
  transformedERC20Event,
  transaction,
  { logger },
) => {
  const eventId = transformedERC20Event._id;

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

  const [erc20BridgeTransferEvents, bridgeFillEvents] = await Promise.all([
    Event.find({
      transactionHash: transformedERC20Event.transactionHash,
      type: 'ERC20BridgeTransfer',
    }).lean(),
    Event.find({
      transactionHash: transformedERC20Event.transactionHash,
      type: 'BridgeFill',
    }).lean(),
  ]);

  /*
   * BridgeFill events aren't supported yet. Log a warning and reschedule for an hours time.
   */
  if (bridgeFillEvents.length > 0) {
    logger.warn(
      `Transaction contains BridgeFill events: ${transformedERC20Event.transactionHash}`,
    );

    await publishJob(
      QUEUE.EVENT_PROCESSING,
      JOB.CREATE_FILLS_FOR_EVENT,
      { eventId },
      { delay: 3600000 }, // Delay for an hour
    );

    return;
  }

  /*
   * If there are no ERC20BridgeTransfer then the transform would have occurred
   * using traditional fills which will be handled through the standard workflow
   */
  if (erc20BridgeTransferEvents.length === 0) {
    logger.info(
      `TransformedERC20 event has no associated ERC20BridgeTransfer events: ${eventId}`,
    );
    return;
  }

  /*
   * If the job has made it this far then we're comfortable enough that fill documents can
   * be created for the associated ERC20BridgeTransfer events. We assume that each ERC20BridgeTransfer
   * event is related to the TransformedERC20 event being processed and will use the TransformedERC20
   * event to dictate the token and taker addresses.
   */
  const fills = dedupeBridgeEvents(erc20BridgeTransferEvents).map(
    bridgeEvent => ({
      _id: bridgeEvent._id,
      affiliateAddress:
        transaction.affiliateAddress !== undefined
          ? transaction.affiliateAddress.toLowerCase()
          : undefined,
      assets: [
        {
          actor: FILL_ACTOR.MAKER,
          amount: new BigNumber(bridgeEvent.data.fromTokenAmount).toNumber(),
          bridgeAddress: bridgeEvent.data.from.toLowerCase(),
          tokenAddress: bridgeEvent.data.fromToken.toLowerCase(),
        },
        {
          actor: FILL_ACTOR.TAKER,
          amount: new BigNumber(bridgeEvent.data.toTokenAmount).toNumber(),
          tokenAddress: bridgeEvent.data.toToken.toLowerCase(),
        },
      ],
      blockHash: transaction.blockHash.toLowerCase(),
      blockNumber: transaction.blockNumber,
      date: transaction.date,
      eventId: bridgeEvent._id,
      logIndex: bridgeEvent.logIndex,
      maker: bridgeEvent.data.from.toLowerCase(),
      protocolVersion: bridgeEvent.protocolVersion,
      quoteDate: transaction.quoteDate,
      taker: transformedERC20Event.data.taker.toLowerCase(),
      transactionHash: transaction.hash.toLowerCase(),
      type: FILL_TYPE.TRANSFORMED_ERC20,
    }),
  );

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
    await createFills(transaction, nonExistantFills, { session });
  });

  logger.info(`created fills for TransformedERC20 event: ${eventId}`);
};

module.exports = processTransformedERC20Event;
