const _ = require('lodash');

const { MissingBlockError } = require('../../errors');
const getBlock = require('../../util/ethereum/get-block');
const getRelayerForFill = require('../../fills/get-relayer-for-fill');
const getRoundedDates = require('./get-rounded-dates');
const normalizeFillArgs = require('./normalize-fill-args');
const tokenCache = require('../../tokens/token-cache');

const createFill = async event => {
  const { protocolVersion } = event;

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
    makerAsset,
    makerToken,
    orderHash,
    paidMakerFee,
    paidTakerFee,
    senderAddress,
    taker,
    takerAsset,
    takerToken,
  } = normalizeFillArgs(args, protocolVersion);

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
    blockNumber,
    date,
    feeRecipient,
    logIndex,
    maker,
    makerAmount: filledMakerTokenAmount,
    makerAsset,
    makerFee: paidMakerFee,
    makerToken,
    orderHash,
    protocolVersion,
    relayerId: _.get(relayer, 'lookupId'),
    roundedDates: getRoundedDates(date),
    senderAddress,
    taker,
    takerAmount: filledTakerTokenAmount,
    takerAsset,
    takerFee: paidTakerFee,
    takerToken,
    tokenSaved: {
      maker: _.has(tokens, makerToken),
      taker: _.has(tokens, takerToken),
    },
    transactionHash,
  };

  return fill;
};

module.exports = createFill;
