const {
  UnsupportedAssetError,
  UnsupportedFeeError,
  UnsupportedProtocolError,
} = require('../errors');

const getAssetsForEvent = require('./get-assets-for-event');
const getFeesForEvent = require('./get-fees-for-event');

const normalizeFillArgs = event => {
  const assets = getAssetsForEvent(event);
  if (assets === undefined) {
    throw new UnsupportedAssetError(`Event has unsupported assets`);
  }

  const fees = getFeesForEvent(event);
  if (fees === undefined) {
    throw new UnsupportedFeeError(`Event has unsupported fees`);
  }

  const { data, protocolVersion } = event;
  const { args, blockHash, blockNumber, logIndex, transactionHash } = data;

  const universalData = {
    assets,
    blockHash,
    blockNumber,
    fees,
    logIndex,
    orderHash: args.orderHash,
    transactionHash,
  };

  if (protocolVersion === 1) {
    return {
      ...universalData,
      feeRecipient: args.feeRecipient,
      maker: args.maker,
      taker: args.taker,
    };
  }

  if (protocolVersion === 2) {
    return {
      ...universalData,
      feeRecipient: args.feeRecipientAddress,
      maker: args.makerAddress,
      senderAddress: args.senderAddress,
      taker: args.takerAddress,
    };
  }

  if (protocolVersion === 3) {
    return {
      ...universalData,
      feeRecipient: args.feeRecipientAddress,
      maker: args.makerAddress,
      protocolFee: args.protocolFeePaid,
      senderAddress: args.senderAddress,
      taker: args.takerAddress,
    };
  }

  throw new UnsupportedProtocolError(
    `Event has unrecognised protocol version: ${protocolVersion}`,
  );
};

module.exports = normalizeFillArgs;
