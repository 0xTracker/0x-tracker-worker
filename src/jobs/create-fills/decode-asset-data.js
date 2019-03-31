const { assetDataUtils } = require('@0x/order-utils');

const decodeAssetData = encodedData => {
  const {
    decodeAssetDataOrThrow,
    isERC20AssetData,
    isERC721AssetData,
  } = assetDataUtils;

  let assetData;

  try {
    assetData = decodeAssetDataOrThrow(encodedData);
  } catch (error) {
    return null;
  }

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

module.exports = decodeAssetData;
