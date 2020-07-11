const _ = require('lodash');

const { FILL_STATUS } = require('../../constants');
const { MissingBlockError } = require('../../errors');
const getBlock = require('../../util/ethereum/get-block');
const getRelayerForFill = require('../../fills/get-relayer-for-fill');

const getBlockOrThrow = async blockHash => {
  const block = await getBlock(blockHash);

  if (block === null) {
    throw new MissingBlockError();
  }

  return block;
};

const buildFill = async (eventData, eventId, protocolVersion) => {
  const {
    assets,
    blockHash,
    blockNumber,
    feeRecipient,
    fees,
    logIndex,
    maker,
    orderHash,
    protocolFee,
    senderAddress,
    taker,
    transactionHash,
  } = eventData;

  const block = await getBlockOrThrow(blockHash);
  const date = new Date(block.timestamp * 1000);

  const relayer = getRelayerForFill({
    feeRecipient,
    senderAddress,
    takerAddress: taker,
  });

  const fill = {
    _id: eventId,
    assets,
    blockHash,
    blockNumber,
    date,
    eventId,
    fees,
    feeRecipient,
    logIndex,
    maker,
    orderHash,
    protocolFee,
    protocolVersion,
    relayerId: _.get(relayer, 'lookupId'),
    senderAddress,
    status: FILL_STATUS.SUCCESSFUL, // TODO: Remove status from app, it no longer makes sense
    taker,
    transactionHash,
  };

  return fill;
};

module.exports = buildFill;
