const _ = require('lodash');
const { BigNumber } = require('@0x/utils');
const { FILL_ACTOR, FILL_TYPE, TOKEN_TYPE } = require('../../../constants');
const createFills = require('../../../fills/create-fills');
const Fill = require('../../../model/fill');
const createNewTokens = require('../../../tokens/create-new-tokens');
const withTransaction = require('../../../util/with-transaction');

const processRfqOrderFilledEvent = async (event, transaction, { logger }) => {
  const eventId = event._id;

  /*
    We must assume that the job may be run multiple times due to errors, timeouts etc.
    If the fill has already been created then log a warning and bail.
  */
  const existingFill = await Fill.findOne({ eventId });
  if (existingFill !== null) {
    logger.warn(`fill for RfqOrderFilled event already exists: ${eventId}`);
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
        amount: new BigNumber(event.data.makerTokenFilledAmount).toNumber(),
        tokenAddress: event.data.makerToken.toLowerCase(),
      },
      {
        actor: FILL_ACTOR.TAKER,
        amount: new BigNumber(event.data.takerTokenFilledAmount).toNumber(),
        tokenAddress: event.data.takerToken.toLowerCase(),
      },
    ],
    blockHash: transaction.blockHash.toLowerCase(),
    blockNumber: transaction.blockNumber,
    date: transaction.date,
    eventId: event._id,
    fees: [],
    logIndex: event.logIndex,
    maker: event.data.maker.toLowerCase(),
    orderHash: event.data.orderHash,
    pool: event.data.pool,
    protocolVersion: 4,
    quoteDate: transaction.quoteDate,
    taker: event.data.taker.toLowerCase(),
    transactionHash: transaction.hash.toLowerCase(),
    type: FILL_TYPE.RFQ_ORDER_FILLED,
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

  logger.info(`created fill for RfqOrderFilled event: ${eventId}`);
};

module.exports = processRfqOrderFilledEvent;
