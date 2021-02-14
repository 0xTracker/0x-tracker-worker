const _ = require('lodash');
const { BigNumber } = require('@0x/utils');
const moment = require('moment');
const mongoose = require('mongoose');

const {
  JOB,
  QUEUE,
  FILL_ACTOR,
  FILL_TYPE,
  TOKEN_TYPE,
} = require('../../constants');
const { publishJob } = require('../../queues');
const createFills = require('../../fills/create-fills');
const createNewTokens = require('../../tokens/create-new-tokens');
const Event = require('../../model/event');
const Fill = require('../../model/fill');
const getTransactionByHash = require('../../transactions/get-transaction-by-hash');
const withTransaction = require('../../util/with-transaction');

const createLiquidityProviderSwapEventFills = async (job, { logger }) => {
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
      QUEUE.FILL_PROCESSING,
      JOB.CREATE_LIQUIDITY_PROVIDER_SWAP_EVENT_FILL,
      job.data,
      { delay: 30000 },
    );

    return;
  }

  /*
    We must assume that the job may be run multiple times due to errors, timeouts etc.
    If the fill has already been created then log a warning and bail.
  */
  const existingFill = await Fill.findOne({ eventId: event._id });
  if (existingFill !== null) {
    logger.warn(
      `fill for LiquidityProviderSwap event already exists: ${eventId}`,
    );
    return;
  }

  const newFill = {
    _id: event._id,
    affiliateAddress:
      transaction.affiliateAddress !== undefined
        ? transaction.affiliateAddress.toLowerCase()
        : undefined,
    assets: [
      {
        actor: FILL_ACTOR.MAKER,
        amount: new BigNumber(event.data.inputTokenAmount).toNumber(),
        bridgeAddress: event.data.provider.toLowerCase(),
        tokenAddress: event.data.inputToken.toLowerCase(),
      },
      {
        actor: FILL_ACTOR.TAKER,
        amount: new BigNumber(event.data.outputTokenAmount).toNumber(),
        tokenAddress: event.data.outputToken.toLowerCase(),
      },
    ],
    blockHash: transaction.blockHash.toLowerCase(),
    blockNumber: transaction.blockNumber,
    date: transaction.date,
    eventId: event._id,
    logIndex: event.logIndex,
    maker: event.data.provider.toLowerCase(),
    protocolVersion:
      transaction.date >= new Date('2021-01-25T00:00:00Z') ? 4 : 3,
    quoteDate: transaction.quoteDate,
    taker: event.data.recipient.toLowerCase(),
    transactionHash: transaction.hash.toLowerCase(),
    type: FILL_TYPE.LIQUIDITY_PROVIDER_SWAP,
  };

  /*
   * Create any tokens which haven't been seen before.
   */
  const uniqTokens = _(newFill.assets.map(asset => asset.tokenAddress))
    .uniq()
    .map(address => ({
      address,
      type: TOKEN_TYPE.ERC20,
    }))
    .value();

  await createNewTokens(uniqTokens);

  await withTransaction(async session => {
    await createFills(transaction, [newFill], { session });
  });

  logger.info(`created fill for LiquidityProviderSwap event: ${eventId}`);
};

module.exports = {
  fn: createLiquidityProviderSwapEventFills,
  jobName: JOB.CREATE_LIQUIDITY_PROVIDER_SWAP_EVENT_FILL,
  queueName: QUEUE.FILL_PROCESSING,
};
