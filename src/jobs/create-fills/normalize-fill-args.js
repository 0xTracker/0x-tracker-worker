const _ = require('lodash');

const {
  UnsupportedAssetError,
  UnsupportedProtocolError,
} = require('../../errors');
const decodeAssetData = require('./decode-asset-data');

const normalizeFillArgs = (args, protocolVersion = 1) => {
  if (protocolVersion === 1) {
    return _.pick(
      args,
      'feeRecipient',
      'filledMakerTokenAmount',
      'filledTakerTokenAmount',
      'maker',
      'makerToken',
      'orderHash',
      'paidMakerFee',
      'paidTakerFee',
      'taker',
      'takerToken',
    );
  }

  if (protocolVersion === 2) {
    const makerAsset = decodeAssetData(args.makerAssetData);
    const takerAsset = decodeAssetData(args.takerAssetData);

    if (makerAsset === null) {
      throw new UnsupportedAssetError(`Event has unsupported maker asset`);
    }

    if (takerAsset === null) {
      throw new UnsupportedAssetError(`Event has unsupported taker asset`);
    }

    return {
      feeRecipient: args.feeRecipientAddress,
      filledMakerTokenAmount: args.makerAssetFilledAmount,
      filledTakerTokenAmount: args.takerAssetFilledAmount,
      maker: args.makerAddress,
      makerAsset,
      makerToken: _.get(makerAsset, 'tokenAddress'), // TODO: Deprecate in favor of makerAsset
      orderHash: args.orderHash,
      paidMakerFee: args.makerFeePaid,
      paidTakerFee: args.takerFeePaid,
      senderAddress: args.senderAddress,
      taker: args.takerAddress,
      takerAsset,
      takerToken: _.get(takerAsset, 'tokenAddress'), // TODO: Deprecate in favor of takerAsset
    };
  }

  throw new UnsupportedProtocolError(
    `Event has unrecognised protocol version: ${protocolVersion}`,
  );
};

module.exports = normalizeFillArgs;
