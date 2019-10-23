const { assetDataUtils } = require('@0x/order-utils');
const { TOKEN_TYPE } = require('../../constants');

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
    return undefined;
  }
};

const createAsset = (singleAssetData, amount) => {
  const simpleAsset = {
    amount,
    tokenAddress: singleAssetData.tokenAddress,
  };

  if (isERC20AssetData(singleAssetData)) {
    return {
      ...simpleAsset,
      tokenType: TOKEN_TYPE.ERC20,
    };
  }

  if (isERC721AssetData(singleAssetData)) {
    return {
      ...simpleAsset,
      tokenId: singleAssetData.tokenId.toNumber(),
      tokenType: TOKEN_TYPE.ERC721,
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

const parseAssetData = (encodedData, amount) => {
  const assetData = decodeAssetData(encodedData);

  if (assetData === undefined) {
    return undefined; // Unable to decode asset data, handle gracefully
  }

  // When the asset data represents a single asset we can just return a single item array.
  if (isERC20AssetData(assetData) || isERC721AssetData(assetData)) {
    return [createAsset(assetData, amount)];
  }

  // When the asset data represents multiple assets we need to extract them all.
  if (isMultiAssetData(assetData)) {
    return extractAssets(assetData);
  }

  return undefined; // Unsupported asset type
};

module.exports = parseAssetData;
