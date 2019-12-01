const _ = require('lodash');

const {
  UnsupportedAssetError,
  UnsupportedFeeError,
  UnsupportedProtocolError,
} = require('../../errors');

const extractFeesFromEventArgs = require('./extract-fees-from-event-args');
const getAssets = require('./get-assets');

const normalizeFillArgs = (args, protocolVersion = 1) => {
  const assets = getAssets(args, protocolVersion);

  if (assets === undefined) {
    throw new UnsupportedAssetError(`Event has unsupported assets`);
  }

  if (protocolVersion === 1) {
    return {
      ..._.pick(
        args,
        'feeRecipient',
        'maker',
        'orderHash',
        'paidMakerFee',
        'paidTakerFee',
        'taker',
      ),
      assets,
    };
  }

  if (protocolVersion === 2) {
    return {
      assets,
      feeRecipient: args.feeRecipientAddress,
      maker: args.makerAddress,
      orderHash: args.orderHash,
      paidMakerFee: args.makerFeePaid,
      paidTakerFee: args.takerFeePaid,
      senderAddress: args.senderAddress,
      taker: args.takerAddress,
    };
  }

  if (protocolVersion === 3) {
    const fees = extractFeesFromEventArgs(args, protocolVersion);

    if (fees === null) {
      throw new UnsupportedFeeError(`Event has unsupported fees`);
    }

    return {
      assets,
      fees,
      feeRecipient: args.feeRecipientAddress,
      maker: args.makerAddress,
      orderHash: args.orderHash,
      protocolFeePaid: args.protocolFeePaid,
      senderAddress: args.senderAddress,
      taker: args.takerAddress,
    };
  }

  throw new UnsupportedProtocolError(
    `Event has unrecognised protocol version: ${protocolVersion}`,
  );
};

module.exports = normalizeFillArgs;
