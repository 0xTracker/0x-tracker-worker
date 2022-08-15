const _ = require('lodash');
const { FILL_TYPE, FILL_ACTOR, TOKEN_TYPE } = require('../../../constants');
const createFills = require('../../../fills/create-fills');
const Fill = require('../../../model/fill');
const createNewTokens = require('../../../tokens/create-new-tokens');
const withTransaction = require('../../../util/with-transaction');
const { checkTokenResolved } = require('../../../tokens/token-cache');

const getAssets = event => {
  const { data } = event;
  const { args } = data;

  const {
    filledMakerTokenAmount,
    filledTakerTokenAmount,
    makerToken,
    takerToken,
  } = args;

  return [
    {
      actor: FILL_ACTOR.MAKER,
      amount: filledMakerTokenAmount,
      tokenAddress: makerToken,
      tokenResolved: checkTokenResolved(makerToken),
      tokenType: TOKEN_TYPE.ERC20,
    },
    {
      actor: FILL_ACTOR.TAKER,
      amount: filledTakerTokenAmount,
      tokenAddress: takerToken,
      tokenResolved: checkTokenResolved(takerToken),
      tokenType: TOKEN_TYPE.ERC20,
    },
  ];
};

const getFees = event => {
  const { data } = event;
  const { args } = data;
  const { paidMakerFee, paidTakerFee } = args;

  return _.compact([
    paidMakerFee > 0
      ? {
          amount: {
            token: paidMakerFee,
          },
          tokenAddress: '0xe41d2489571d322189246dafa5ebde1f4699f498', // ZRX
          tokenType: 0,
          traderType: 0,
        }
      : undefined,
    paidTakerFee > 0
      ? {
          amount: {
            token: paidTakerFee,
          },
          tokenAddress: '0xe41d2489571d322189246dafa5ebde1f4699f498', // ZRX
          tokenType: 0,
          traderType: 1,
        }
      : undefined,
  ]);
};

const getEventData = event => {
  const { data } = event;
  const { args, logIndex } = data;

  return {
    logIndex,
    orderHash: args.orderHash,
    feeRecipient: args.feeRecipient,
    maker: args.maker,
    taker: args.taker,
  };
};

const processLogFillEvent = async (event, transaction, { logger }) => {
  const eventId = event._id;

  /*
    We must assume that the job may be run multiple times due to errors, timeouts etc.
    If the fill has already been created then log a warning and bail.
  */
  const existingFill = await Fill.findOne({ eventId });
  if (existingFill !== null) {
    logger.warn(`fill for LogFill event already exists: ${eventId}`);
    return;
  }

  const assets = getAssets(event);
  const fees = getFees(event);
  const eventData = getEventData(event);

  const newFill = {
    _id: event._id,
    affiliateAddress: transaction.affiliateAddress,
    assets,
    blockHash: transaction.blockHash.toLowerCase(),
    blockNumber: transaction.blockNumber,
    date: transaction.date,
    eventId: event._id,
    fees,
    feeRecipient: eventData.feeRecipient.toLowerCase(),
    logIndex: eventData.logIndex,
    maker: eventData.maker.toLowerCase(),
    orderHash: eventData.orderHash,
    protocolVersion: 1,
    quoteDate: transaction.quoteDate,
    taker: eventData.taker.toLowerCase(),
    transactionHash: transaction.hash.toLowerCase(),
    type: FILL_TYPE.REGULAR,
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

  logger.info(`created fill for LogFill event: ${eventId}`);
};

module.exports = processLogFillEvent;
