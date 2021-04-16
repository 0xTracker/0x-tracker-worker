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

const SOURCE_BRIDGE_MAPPINGS = {
  '0': '0xfe01821ca163844203220cd08e4f2b2fb43ae4e4', // Balancer
  '1': '0xc880c252db7c51f74161633338a3bdafa8e65276', // Bancor
  '3': '0x1796cd592d19e3bcd744fbb025bb61a6d8cb2c09', // Curve
  '4': '0xb9d4bf2c8dab828f4ffb656acdb6c2b497d44f25', // Cream
  '5': '0x015850307f6aab4ac6631923ceefe71b57492c9b', // Crypto.com
  '6': '0xe9da66965a9344aab2167e6813c03f043cc7a6ca', // DODO
  '7': '0xadd97271402590564ddd8ad23cb5317b1fb0fffb', // Kyber
  '9': '0x02b7eca484ad960fca3f7709e0b2ac81eec3069c', // Mooniswap
  '10': '0x2bf04fcea05f0989a14d9afa37aa376baca6b2b3', // mStable
  '11': '0x991c745401d5b5e469b8c3e2cb02c748f08754f1', // Oasis
  '12': '0xf1c0811e3788caae7dbfae43da9d9131b1a8a148', // Shell
  '14': '0x47ed0262a0b688dcb836d254c6a2e96b6c48a9f5', // Sushiswap
  '15': '0xf9786d5eb1de47fa56a8f7bb387653c6d410bfee', // Swerve
  '16': '0x36691c4f426eb8f42f150ebde43069a31cb080ad', // Uniswap v1
  '17': '0xdcd6011f4c6b80e470d9487f5871a0cba7c93f48', // Uniswap v2
  '18': '0xe9da66965a9344aab2167e6813c03f043cc7a6ca', // DODO v2

  // The following mappings are best guesses. Replace once mappings have been confirmed.
  Balancer: '0xfe01821ca163844203220cd08e4f2b2fb43ae4e4', // Balancer
  Bancor: '0xc880c252db7c51f74161633338a3bdafa8e65276', // Bancor
  Curve: '0x1796cd592d19e3bcd744fbb025bb61a6d8cb2c09', // Curve
  Cream: '0xb9d4bf2c8dab828f4ffb656acdb6c2b497d44f25', // Cream
  Cryptocom: '0x015850307f6aab4ac6631923ceefe71b57492c9b', // Crypto.com
  DODO: '0xe9da66965a9344aab2167e6813c03f043cc7a6ca', // DODO
  Kyber: '0xadd97271402590564ddd8ad23cb5317b1fb0fffb', // Kyber
  Mooniswap: '0x02b7eca484ad960fca3f7709e0b2ac81eec3069c', // Mooniswap
  mStable: '0x2bf04fcea05f0989a14d9afa37aa376baca6b2b3', // mStable
  Oasis: '0x991c745401d5b5e469b8c3e2cb02c748f08754f1', // Oasis
  Shell: '0xf1c0811e3788caae7dbfae43da9d9131b1a8a148', // Shell
  Sushiswap: '0x47ed0262a0b688dcb836d254c6a2e96b6c48a9f5', // Sushiswap
  Swerve: '0xf9786d5eb1de47fa56a8f7bb387653c6d410bfee', // Swerve
  UniswapV1: '0x36691c4f426eb8f42f150ebde43069a31cb080ad', // Uniswap v1
  UniswapV2: '0xdcd6011f4c6b80e470d9487f5871a0cba7c93f48', // Uniswap v2
  DODOV2: '0xe9da66965a9344aab2167e6813c03f043cc7a6ca', // DODO v2
};

const dedupeEvents = events => {
  return _.uniqWith(events, (a, b) => _.isEqual(a.data, b.data));
};

/**
 This is a temporary solution until a more robust liquidity source
 attribution engine can be built.
 */
const mapSourceToBridgeAddress = (source, logger) => {
  const bridge = SOURCE_BRIDGE_MAPPINGS[source];

  if (bridge === undefined) {
    logger.warn(`Unrecognised source: ${source}`);

    return undefined;
  }

  return bridge;
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
            bridgeAddress: mapSourceToBridgeAddress(
              bridgeFillEvent.data.source,
              logger,
            ),
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
