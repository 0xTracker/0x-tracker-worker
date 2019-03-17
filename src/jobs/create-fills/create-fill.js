const { assetDataUtils } = require('@0x/order-utils');

const _ = require('lodash');

const Event = require('../../model/event');
const Fill = require('../../model/fill');
const getBlock = require('../../util/ethereum/get-block');
const getRelayerForFill = require('../../fills/get-relayer-for-fill');
const getRoundedDates = require('./get-rounded-dates');
const MissingBlockError = require('./missing-block-error');
const tokenCache = require('../../tokens/token-cache');

const decodeAssetData = assetData => {
  const asset = assetDataUtils.decodeAssetDataOrThrow(assetData);

  return {
    ...asset,
    tokenId: _.has(asset, 'tokenId') ? asset.tokenId.toNumber() : undefined,
  };
};

const normaliseFillArguments = (args, protocolVersion) => {
  if (_.isUndefined(protocolVersion) || protocolVersion === 1) {
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

  throw new Error(`Unrecognised protocol version: ${protocolVersion}`);
};

const saveFill = async event => {
  const { protocolVersion } = event;
  const {
    args,
    blockHash,
    blockNumber,
    logIndex,
    transactionHash,
  } = event.data;
  const {
    feeRecipient,
    filledMakerTokenAmount,
    filledTakerTokenAmount,
    maker,
    makerAsset,
    makerToken,
    orderHash,
    paidMakerFee,
    paidTakerFee,
    senderAddress,
    taker,
    takerAsset,
    takerToken,
  } = normaliseFillArguments(args, protocolVersion);

  const block = await getBlock(blockHash);

  if (block === null) {
    throw new MissingBlockError();
  }

  const date = new Date(block.timestamp * 1000);
  const tokens = tokenCache.getTokens();
  const relayer = getRelayerForFill({
    feeRecipient,
    takerAddress: taker,
  });

  const fill = {
    blockHash,
    blockNumber: parseInt(blockNumber, 16),
    date,
    feeRecipient,
    logIndex,
    maker,
    makerAmount: filledMakerTokenAmount,
    makerAsset,
    makerFee: paidMakerFee,
    makerToken,
    orderHash,
    protocolVersion,
    relayerId: _.get(relayer, 'lookupId'),
    roundedDates: getRoundedDates(date),
    senderAddress,
    taker,
    takerAmount: filledTakerTokenAmount,
    takerAsset,
    takerFee: paidTakerFee,
    takerToken,
    tokenSaved: {
      maker: _.has(tokens, makerToken),
      taker: _.has(tokens, takerToken),
    },
    transactionHash,
  };

  await Fill.create(fill);
  await Event.updateOne({ _id: event._id }, { fillCreated: true });
};

module.exports = saveFill;
