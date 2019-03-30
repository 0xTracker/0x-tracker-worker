const { assetDataUtils } = require('@0x/order-utils');

const _ = require('lodash');

const {
  MissingBlockError,
  UnsupportedAssetError,
  UnsupportedProtocolError,
} = require('../../errors');
const Event = require('../../model/event');
const Fill = require('../../model/fill');
const getBlock = require('../../util/ethereum/get-block');
const getRelayerForFill = require('../../fills/get-relayer-for-fill');
const getRoundedDates = require('./get-rounded-dates');
const tokenCache = require('../../tokens/token-cache');

const decodeAssetData = encodedData => {
  const {
    decodeAssetDataOrThrow,
    isERC20AssetData,
    isERC721AssetData,
  } = assetDataUtils;

  const assetData = decodeAssetDataOrThrow(encodedData);

  if (isERC20AssetData(assetData)) {
    return assetData;
  }

  if (isERC721AssetData(assetData)) {
    return {
      ...assetData,
      tokenId: assetData.tokenId.toNumber(),
    };
  }

  return null; // Unsupported asset type
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

const createFill = async event => {
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

module.exports = createFill;
