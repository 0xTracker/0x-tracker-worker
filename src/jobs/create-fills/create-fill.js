const _ = require('lodash');

const Event = require('../../model/event');
const Fill = require('../../model/fill');
const getBlock = require('../../util/ethereum/get-block');
const getRelayerForFill = require('../../fills/get-relayer-for-fill');
const getRoundedDates = require('./get-rounded-dates');
const MissingBlockError = require('./missing-block-error');
const tokenCache = require('../../tokens/token-cache');

const saveFill = async event => {
  const {
    args,
    blockHash,
    blockNumber,
    logIndex,
    transactionHash,
  } = event.data;

  const {
    feeRecipient,
    filledMakerTokenAmount,
    filledTakerTokenAmount,
    maker,
    makerToken,
    orderHash,
    paidMakerFee,
    paidTakerFee,
    taker,
    takerToken,
  } = args;

  const block = await getBlock(blockHash);

  if (block === null) {
    throw new MissingBlockError();
  }

  const date = new Date(block.timestamp * 1000);
  const tokens = tokenCache.getTokens();
  const relayer = getRelayerForFill({
    feeRecipient,
    takerAddress: taker,
  });

  const fill = {
    blockHash,
    blockNumber: parseInt(blockNumber, 16),
    date,
    feeRecipient,
    logIndex,
    maker,
    makerAmount: filledMakerTokenAmount,
    makerFee: paidMakerFee,
    makerToken,
    orderHash,
    relayerId: _.get(relayer, 'lookupId'),
    roundedDates: getRoundedDates(date),
    taker,
    takerAmount: filledTakerTokenAmount,
    takerFee: paidTakerFee,
    takerToken,
    tokenSaved: {
      maker: _.has(tokens, makerToken),
      taker: _.has(tokens, takerToken),
    },
    transactionHash,
  };

  await Fill.create(fill);
  await Event.updateOne({ _id: event._id }, { fillCreated: true });
};

module.exports = saveFill;
