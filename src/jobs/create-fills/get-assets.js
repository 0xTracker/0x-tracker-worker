const { FILL_ACTOR } = require('../../constants');
const { checkTokenResolved } = require('../../tokens/token-cache');
const decodeAssetData = require('./decode-asset-data');

const getAssets = (eventArgs, protocolVersion) => {
  if (protocolVersion === 1) {
    return [
      {
        actor: FILL_ACTOR.MAKER,
        amount: eventArgs.filledMakerTokenAmount,
        tokenAddress: eventArgs.makerToken,
        tokenResolved: checkTokenResolved(eventArgs.makerToken),
      },
      {
        actor: FILL_ACTOR.TAKER,
        amount: eventArgs.filledTakerTokenAmount,
        tokenAddress: eventArgs.takerToken,
        tokenResolved: checkTokenResolved(eventArgs.takerToken),
      },
    ];
  }

  if (protocolVersion === 2) {
    const {
      makerAssetData,
      makerAssetFilledAmount,
      takerAssetData,
      takerAssetFilledAmount,
    } = eventArgs;

    const makerAsset = decodeAssetData(makerAssetData);
    const takerAsset = decodeAssetData(takerAssetData);

    if (makerAsset === null || takerAsset === null) {
      return null;
    }

    return [
      {
        actor: FILL_ACTOR.MAKER,
        amount: makerAssetFilledAmount,
        tokenAddress: makerAsset.tokenAddress,
        tokenId: makerAsset.tokenId,
        tokenResolved: checkTokenResolved(makerAsset.tokenAddress),
      },
      {
        actor: FILL_ACTOR.TAKER,
        amount: takerAssetFilledAmount,
        tokenAddress: takerAsset.tokenAddress,
        tokenId: takerAsset.tokenId,
        tokenResolved: checkTokenResolved(takerAsset.tokenAddress),
      },
    ];
  }

  return null; // Unrecognised protocol version
};

module.exports = getAssets;
