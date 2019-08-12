const _ = require('lodash');

const { MissingBlockError } = require('../../errors');
const getBlock = require('../../util/ethereum/get-block');
const getRelayerForFill = require('../../fills/get-relayer-for-fill');
const normalizeFillArgs = require('./normalize-fill-args');

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
    maker,
    orderHash,
    paidMakerFee,
    paidTakerFee,
    senderAddress,
    taker,
  } = normalizeFillArgs(args, protocolVersion);

  const block = await getBlock(blockHash);

  if (block === null) {
    throw new MissingBlockError();
  }

  const date = new Date(block.timestamp * 1000);
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
    blockHash,
    blockNumber,
    conversions,
    date,
    eventId: event._id,
    feeRecipient,
    logIndex,
    maker,
    makerFee: paidMakerFee,
    orderHash,
    protocolVersion,
    relayerId: _.get(relayer, 'lookupId'),
    senderAddress,
    taker,
    takerFee: paidTakerFee,
    transactionHash,
  };

  return fill;
};

module.exports = createFill;
