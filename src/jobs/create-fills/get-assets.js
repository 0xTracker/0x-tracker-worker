const { FILL_ACTOR, TOKEN_TYPE } = require('../../constants');
const { checkTokenResolved } = require('../../tokens/token-cache');
const decodeAssetData = require('./decode-asset-data');

const getTokenType = assetProxyId => {
  return {
    '0xf47261b0': TOKEN_TYPE.ERC20,
    '0x02571792': TOKEN_TYPE.ERC721,
  }[assetProxyId];
};

const getAssets = (eventArgs, protocolVersion) => {
  if (protocolVersion === 1) {
    return [
      {
        actor: FILL_ACTOR.MAKER,
        amount: eventArgs.filledMakerTokenAmount,
        tokenAddress: eventArgs.makerToken,
        tokenResolved: checkTokenResolved(eventArgs.makerToken),
        tokenType: TOKEN_TYPE.ERC20,
      },
      {
        actor: FILL_ACTOR.TAKER,
        amount: eventArgs.filledTakerTokenAmount,
        tokenAddress: eventArgs.takerToken,
        tokenResolved: checkTokenResolved(eventArgs.takerToken),
        tokenType: TOKEN_TYPE.ERC20,
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
        tokenType: getTokenType(makerAsset.assetProxyId),
      },
      {
        actor: FILL_ACTOR.TAKER,
        amount: takerAssetFilledAmount,
        tokenAddress: takerAsset.tokenAddress,
        tokenId: takerAsset.tokenId,
        tokenResolved: checkTokenResolved(takerAsset.tokenAddress),
        tokenType: getTokenType(takerAsset.assetProxyId),
      },
    ];
  }

  return null; // Unrecognised protocol version
};

module.exports = getAssets;
