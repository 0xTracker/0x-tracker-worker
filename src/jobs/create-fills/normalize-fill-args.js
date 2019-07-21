const _ = require('lodash');

const {
  UnsupportedAssetError,
  UnsupportedProtocolError,
} = require('../../errors');

const decodeAssetData = require('./decode-asset-data');
const getAssets = require('./get-assets');

const normalizeFillArgs = (args, protocolVersion = 1) => {
  const assets = getAssets(args, protocolVersion);

  if (assets === null) {
    throw new UnsupportedAssetError(`Event has unsupported assets`);
  }

  if (protocolVersion === 1) {
    return {
      ..._.pick(
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
      ),
      assets,
    };
  }

  if (protocolVersion === 2) {
    const makerAsset = decodeAssetData(args.makerAssetData);
    const takerAsset = decodeAssetData(args.takerAssetData);

    return {
      assets,
      feeRecipient: args.feeRecipientAddress,
      filledMakerTokenAmount: args.makerAssetFilledAmount, // TODO: Deprecate in favor of assets
      filledTakerTokenAmount: args.takerAssetFilledAmount, // TODO: Deprecate in favor of assets
      maker: args.makerAddress,
      makerAsset, // TODO: Deprecate in favor of assets
      makerToken: _.get(makerAsset, 'tokenAddress'), // TODO: Deprecate in favor of assets
      orderHash: args.orderHash,
      paidMakerFee: args.makerFeePaid,
      paidTakerFee: args.takerFeePaid,
      senderAddress: args.senderAddress,
      taker: args.takerAddress,
      takerAsset, // TODO: Deprecate in favor of assets
      takerToken: _.get(takerAsset, 'tokenAddress'), // TODO: Deprecate in favor of assets
    };
  }

  throw new UnsupportedProtocolError(
    `Event has unrecognised protocol version: ${protocolVersion}`,
  );
};

module.exports = normalizeFillArgs;
