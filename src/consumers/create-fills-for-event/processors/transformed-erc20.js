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

const dedupeEvents = events => {
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
    Temporary guard until I can confirm how this scenario should be handled with 0x team.
  */
  if (bridgeFillEvents.length > 0 && erc20BridgeTransferEvents.length > 0) {
    logger.warn(
      `Transaction contains both BridgeFill and ERC20BridgeTransfer events: ${transformedERC20Event.transactionHash}`,
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
   * If there are no ERC20BridgeTransfer or BridgeFill events then the transform would have occurred
   * using traditional fills which will be handled through the standard workflow
   */
  if (erc20BridgeTransferEvents.length === 0 && bridgeFillEvents.length === 0) {
    logger.info(
      `TransformedERC20 event has no associated ERC20BridgeTransfer or BridgeFill events: ${eventId}`,
    );
    return;
  }

  /*
   * If the job has made it this far then we're comfortable enough that fill documents can
   * be created for the associated ERC20BridgeTransfer/BridgeFill events. We assume that each
   * ERC20BridgeTransfer/BridgeFill event is related to the TransformedERC20 event being processed
   * and will use the event to dictate the token and taker addresses.
   */
  const fills = dedupeEvents(erc20BridgeTransferEvents)
    .map(bridgeTransferEvent => ({
      _id: bridgeTransferEvent._id,
      affiliateAddress:
        transaction.affiliateAddress !== undefined
          ? transaction.affiliateAddress.toLowerCase()
          : undefined,
      assets: [
        {
          actor: FILL_ACTOR.MAKER,
          amount: new BigNumber(
            bridgeTransferEvent.data.fromTokenAmount,
          ).toNumber(),
          bridgeAddress: bridgeTransferEvent.data.from.toLowerCase(),
          tokenAddress: bridgeTransferEvent.data.fromToken.toLowerCase(),
        },
        {
          actor: FILL_ACTOR.TAKER,
          amount: new BigNumber(
            bridgeTransferEvent.data.toTokenAmount,
          ).toNumber(),
          tokenAddress: bridgeTransferEvent.data.toToken.toLowerCase(),
        },
      ],
      blockHash: transaction.blockHash.toLowerCase(),
      blockNumber: transaction.blockNumber,
      date: transaction.date,
      eventId: bridgeTransferEvent._id,
      logIndex: bridgeTransferEvent.logIndex,
      maker: bridgeTransferEvent.data.from.toLowerCase(),
      protocolVersion: bridgeTransferEvent.protocolVersion,
      quoteDate: transaction.quoteDate,
      taker: transformedERC20Event.data.taker.toLowerCase(),
      transactionHash: transaction.hash.toLowerCase(),
      type: FILL_TYPE.TRANSFORMED_ERC20,
    }))
    .concat(
      dedupeEvents(bridgeFillEvents).map(bridgeFillEvent => ({
        _id: bridgeFillEvent._id,
        affiliateAddress:
          transaction.affiliateAddress !== undefined
            ? transaction.affiliateAddress.toLowerCase()
            : undefined,
        assets: [
          {
            actor: FILL_ACTOR.MAKER,
            amount: new BigNumber(
              bridgeFillEvent.data.inputTokenAmount,
            ).toNumber(),
            tokenAddress: bridgeFillEvent.data.inputToken.toLowerCase(),
          },
          {
            actor: FILL_ACTOR.TAKER,
            amount: new BigNumber(
              bridgeFillEvent.data.outputTokenAmount,
            ).toNumber(),
            tokenAddress: bridgeFillEvent.data.outputToken.toLowerCase(),
          },
        ],
        blockHash: transaction.blockHash.toLowerCase(),
        blockNumber: transaction.blockNumber,
        date: transaction.date,
        eventId: bridgeFillEvent._id,
        logIndex: bridgeFillEvent.logIndex,
        protocolVersion: bridgeFillEvent.protocolVersion,
        quoteDate: transaction.quoteDate,
        source: bridgeFillEvent.data.source,
        taker: transformedERC20Event.data.taker.toLowerCase(),
        transactionHash: transaction.hash.toLowerCase(),
        type: FILL_TYPE.BRIDGE_FILL,
      })),
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
    Finally, create fills for the unprocessed events.
  */
  await withTransaction(async session => {
    await createFills(transaction, nonExistantFills, { session });
  });

  logger.info(`created fills for TransformedERC20 event: ${eventId}`);
};

module.exports = processTransformedERC20Event;
