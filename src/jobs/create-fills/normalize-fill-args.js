const _ = require('lodash');

const {
  UnsupportedAssetError,
  // UnsupportedFeeError,
  UnsupportedProtocolError,
} = require('../../errors');

const getAssets = require('./get-assets');

const normalizeFillArgs = (args, protocolVersion = 1) => {
  const assets = getAssets(args, protocolVersion);

  if (assets === undefined) {
    throw new UnsupportedAssetError(`Event has unsupported assets`);
  }

  // const fees = getFees(args, protocolVersion);

  // if (fees === null) {
  //   throw new UnsupportedFeeError(`Event has unsupported fees`);
  // }

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

  throw new UnsupportedProtocolError(
    `Event has unrecognised protocol version: ${protocolVersion}`,
  );
};

module.exports = normalizeFillArgs;
