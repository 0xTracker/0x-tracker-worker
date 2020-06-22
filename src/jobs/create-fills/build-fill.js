const _ = require('lodash');

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

const buildFill = async ({
  assets,
  blockHash,
  blockNumber,
  eventId,
  feeRecipient,
  fees,
  logIndex,
  maker,
  orderHash,
  protocolFee,
  protocolVersion,
  senderAddress,
  taker,
  transactionHash,
}) => {
  const block = await getBlockOrThrow(blockHash);
  const date = new Date(block.timestamp * 1000);

  const relayer = getRelayerForFill({
    feeRecipient,
    senderAddress,
    takerAddress: taker,
  });

  const fill = {
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
    taker,
    transactionHash,
  };

  return fill;
};

module.exports = buildFill;
