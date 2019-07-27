const _ = require('lodash');

const { MissingBlockError } = require('../../errors');
const getBlock = require('../../util/ethereum/get-block');
const getRelayerForFill = require('../../fills/get-relayer-for-fill');
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
    assets,
    feeRecipient,
    filledMakerTokenAmount,
    filledTakerTokenAmount,
    maker,
    makerToken,
    orderHash,
    paidMakerFee,
    paidTakerFee,
    senderAddress,
    taker,
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

  const conversions =
    paidMakerFee + paidTakerFee === 0
      ? {
          USD: { makerFee: 0, takerFee: 0 },
        }
      : undefined;

  const fill = {
    assets,
    assetsMigrated: true,
    blockHash,
    blockNumber,
    conversions,
    date,
    eventId: event._id,
    feeRecipient,
    logIndex,
    maker,
    makerAmount: filledMakerTokenAmount,
    makerFee: paidMakerFee,
    makerToken,
    orderHash,
    protocolVersion,
    relayerId: _.get(relayer, 'lookupId'),
    senderAddress,
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

  return fill;
};

module.exports = createFill;
