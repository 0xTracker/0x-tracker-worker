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

const createSushiswapSwapEventFill = async (job, { logger }) => {
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

  const existingFill = await Fill.findById(eventId);

  if (existingFill !== null) {
    logger.warn(`fill already created for event: ${eventId}`);
    return;
  }

  /**
   * Verify that the associated transaction has been fetched.
   */
  const transaction = await getTransactionByHash(event.transactionHash);

  if (transaction === null) {
    /*
     * If more than 5 minutes have passed since the SushiswapSwap event was fetched then
     * this might indicate a bottleneck or failure in the transaction fetching job.
     */
    if (moment().diff(event.dateIngested, 'minutes') >= 5) {
      logger.warn(`transaction not found for event: ${event._id}`);
    }

    await publishJob(
      QUEUE.EVENT_PROCESSING,
      JOB.CREATE_SUSHISWAP_SWAP_EVENT_FILL,
      job.data,
      { delay: 30000 },
    );

    return;
  }

  /*
   * Finally, once all checks have passed, create the fill and associate token documents.
   */
  const fill = {
    _id: event._id,
    affiliateAddress:
      transaction.affiliateAddress !== undefined
        ? transaction.affiliateAddress.toLowerCase()
        : undefined,
    assets: [
      {
        actor: FILL_ACTOR.MAKER,
        amount: new BigNumber(event.data.makerAmount).toNumber(),
        tokenAddress: event.data.makerToken,

        /* 
          Sushiswap Bridge – this is a bit of a hack for tracking purposes and should
          be replaced longer-term with something better (e.g. liquidity source)
        */
        bridgeAddress: '0x47ed0262a0b688dcb836d254c6a2e96b6c48a9f5',
      },
      {
        actor: FILL_ACTOR.TAKER,
        amount: new BigNumber(event.data.takerAmount).toNumber(),
        tokenAddress: event.data.takerToken.toLowerCase(),
      },
    ],
    blockHash: transaction.blockHash.toLowerCase(),
    blockNumber: transaction.blockNumber,
    date: transaction.date,
    eventId: event._id,
    logIndex: event.logIndex,
    maker: event.data.maker.toLowerCase(),
    protocolVersion:
      transaction.date >= new Date('2021-01-25T00:00:00Z') ? 4 : 3,
    quoteDate: transaction.quoteDate,
    taker: event.data.taker.toLowerCase(),
    transactionHash: transaction.hash.toLowerCase(),
    type: FILL_TYPE.SUSHISWAP_SWAP,
  };

  await createNewTokens(
    fill.assets.map(asset => ({
      address: asset.tokenAddress,
      type: TOKEN_TYPE.ERC20,
    })),
  );

  await createFills(transaction, [fill]);

  logger.info(`created fill for SushiswapSwap event: ${eventId}`);
};

module.exports = {
  fn: createSushiswapSwapEventFill,
  jobName: JOB.CREATE_SUSHISWAP_SWAP_EVENT_FILL,
  queueName: QUEUE.EVENT_PROCESSING,
};
