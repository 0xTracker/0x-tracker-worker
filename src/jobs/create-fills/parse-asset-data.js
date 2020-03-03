const _ = require('lodash');
const { assetDataUtils } = require('@0x/order-utils');
const { TOKEN_TYPE } = require('../../constants');

const { decodeAssetDataOrThrow } = assetDataUtils;

const isERC20AssetData = assetData => assetData.assetProxyId === '0xf47261b0';
const isERC721AssetData = assetData => assetData.assetProxyId === '0x02571792';
const isMultiAssetData = assetData => assetData.assetProxyId === '0x94cfcdd7';
const isERC20BridgeAssetData = assetData =>
  assetData.assetProxyId === '0xdc1600f3';
const isERC1155AssetData = assetData => assetData.assetProxyId === '0xa7cb5fb7';

const decodeAssetData = assetData => {
  try {
    return decodeAssetDataOrThrow(assetData);
  } catch (error) {
    return undefined;
  }
};

const createAsset = (assetData, amount) => {
  const baseAsset = {
    amount,
    tokenAddress: assetData.tokenAddress,
  };

  if (isERC20AssetData(assetData)) {
    return {
      ...baseAsset,
      tokenType: TOKEN_TYPE.ERC20,
    };
  }

  if (isERC721AssetData(assetData)) {
    return {
      ...baseAsset,
      tokenId: assetData.tokenId.toNumber(),
      tokenType: TOKEN_TYPE.ERC721,
    };
  }

  if (isERC20BridgeAssetData(assetData)) {
    return {
      ...baseAsset,
      bridgeAddress: assetData.bridgeAddress,
      bridgeData: assetData.bridgeData,
      tokenAddress: assetData.tokenAddress,
      tokenType: TOKEN_TYPE.ERC20,
    };
  }

  return undefined; // Unrecognised asset
};

const extractAssets = multiAssetData => {
  const decodedAssetsData = multiAssetData.nestedAssetData.map(decodeAssetData);

  // Handle gracefully when nested asset data cannot be decoded
  if (decodedAssetsData.some(asset => asset === undefined)) {
    return undefined;
  }

  const assets = decodedAssetsData.map((assetData, index) =>
    createAsset(assetData, multiAssetData.amounts[index].toNumber()),
  );

  // Handle gracefully when one or more nested assets are unsupported
  if (assets.some(asset => asset === undefined)) {
    return undefined;
  }

  return assets;
};

const extractERC1155Assets = assetData => {
  return assetData.tokenValues.map((amount, index) => ({
    amount: amount.toNumber(),
    tokenAddress: assetData.tokenAddress,
    tokenId: _.has(assetData.tokenIds, index)
      ? assetData.tokenIds.index.toNumber()
      : undefined,
    tokenType: TOKEN_TYPE.ERC1155,
  }));
};

const parseAssetData = (encodedData, amount) => {
  const assetData = decodeAssetData(encodedData);

  if (assetData === undefined) {
    return undefined; // Unable to decode asset data, handle gracefully
  }

  // When the asset data represents a single asset we can just return a single item array.
  if (
    isERC20AssetData(assetData) ||
    isERC721AssetData(assetData) ||
    isERC20BridgeAssetData(assetData)
  ) {
    return [createAsset(assetData, amount)];
  }

  // ERC-1155 can represent multiple assets so we must extract them all.
  if (isERC1155AssetData(assetData)) {
    return extractERC1155Assets(assetData);
  }

  // When the asset data represents multiple assets we need to extract them all.
  if (isMultiAssetData(assetData)) {
    return extractAssets(assetData);
  }

  return undefined; // Unsupported asset type
};

module.exports = parseAssetData;
