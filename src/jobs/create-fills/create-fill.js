const _ = require('lodash');

const { MissingBlockError } = require('../../errors');
const getBlock = require('../../util/ethereum/get-block');
const getRelayerForFill = require('../../fills/get-relayer-for-fill');
const normalizeEventArgs = require('./normalize-event-args');

const getBlockOrThrow = async blockHash => {
  const block = await getBlock(blockHash);

  if (block === null) {
    throw new MissingBlockError();
  }

  return block;
};

const createFill = async event => {
  const { data, protocolVersion } = event;
  const { args, blockHash, blockNumber, logIndex, transactionHash } = data;
  const {
    assets,
    fees,
    feeRecipient,
    maker,
    orderHash,
    paidMakerFee,
    paidTakerFee,
    protocolFeePaid,
    senderAddress,
    taker,
  } = normalizeEventArgs(args, protocolVersion);

  const block = await getBlockOrThrow(blockHash);
  const date = new Date(block.timestamp * 1000);

  const relayer = getRelayerForFill({
    feeRecipient,
    senderAddress,
    takerAddress: taker,
  });

  const feeless =
    (paidMakerFee || 0) + (paidTakerFee || 0) === 0 ||
    _.every(fees, { token: 0 });

  const fill = {
    assets,
    blockHash,
    blockNumber,
    conversions: feeless
      ? {
          USD: { makerFee: 0, takerFee: 0 },
        }
      : undefined,
    date,
    eventId: event._id,
    fees,
    feeRecipient,
    logIndex,
    maker,
    makerFee: paidMakerFee,
    orderHash,
    protocolFee: protocolFeePaid,
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
