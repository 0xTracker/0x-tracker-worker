const getAssetsForEvent = require('./get-assets-for-event');
const getFeesForEvent = require('./get-fees-for-event');

const getEventData = event => {
  const assets = getAssetsForEvent(event);
  const fees = getFeesForEvent(event);

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

  return {
    ...universalData,
    feeRecipient: args.feeRecipientAddress,
    maker: args.makerAddress,
    protocolFee: args.protocolFeePaid,
    senderAddress: args.senderAddress,
    taker: args.takerAddress,
  };
};

module.exports = getEventData;
