const _ = require('lodash');
const { assetDataUtils } = require('@0x/order-utils');

const { FILL_ACTOR, TOKEN_TYPE } = require('../../constants');
const { checkTokenResolved } = require('../../tokens/token-cache');

const {
  decodeAssetDataOrThrow,
  isERC20AssetData,
  isERC721AssetData,
  isMultiAssetData,
} = assetDataUtils;

const decodeAssetData = assetData => {
  try {
    return decodeAssetDataOrThrow(assetData);
  } catch (error) {
    return null;
  }
};

const createAssetForActor = (actor, assetData, amount) => {
  const simpleAsset = {
    actor,
    amount,
    tokenAddress: assetData.tokenAddress,
  };

  if (isERC20AssetData(assetData)) {
    return {
      ...simpleAsset,
      tokenType: TOKEN_TYPE.ERC20,
    };
  }

  if (isERC721AssetData(assetData)) {
    return {
      ...simpleAsset,
      tokenId: assetData.tokenId.toNumber(),
      tokenType: TOKEN_TYPE.ERC721,
    };
  }

  return null; // Unrecognised asset
};

const getAssetsForActor = (eventArgs, actor) => {
  const { amount, encodedData } =
    actor === FILL_ACTOR.MAKER
      ? {
          amount: eventArgs.makerAssetFilledAmount,
          encodedData: eventArgs.makerAssetData,
        }
      : {
          amount: eventArgs.takerAssetFilledAmount,
          encodedData: eventArgs.takerAssetData,
        };

  const assetData = decodeAssetData(encodedData);

  if (assetData === null) {
    return null; // Unable to decode asset data, handle gracefully
  }

  if (isERC20AssetData(assetData) || isERC721AssetData(assetData)) {
    return createAssetForActor(actor, assetData, amount);
  }

  if (isMultiAssetData(assetData)) {
    const { amounts } = assetData;
    const nestedAssetsData = assetData.nestedAssetData.map(decodeAssetData);
    const nestedAssets = nestedAssetsData.map((nestedAssetData, index) =>
      createAssetForActor(actor, nestedAssetData, amounts[index].toNumber()),
    );

    return nestedAssets;
  }

  return null; // Unsupported asset type
};

const getV2Assets = eventArgs => {
  const assets = _([FILL_ACTOR.MAKER, FILL_ACTOR.TAKER])
    .map(actor => getAssetsForActor(eventArgs, actor))
    .flatten()
    .value();

  if (assets.some(asset => asset === null)) {
    return null;
  }

  return assets.map(asset => ({
    ...asset,
    tokenResolved: checkTokenResolved(asset.tokenAddress),
  }));
};

module.exports = getV2Assets;
