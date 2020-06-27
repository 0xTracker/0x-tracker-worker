const { FILL_ACTOR, TOKEN_TYPE } = require('../constants');
const { checkTokenResolved } = require('../tokens/token-cache');
const parseAssetData = require('../util/parse-asset-data');

const getAssets = event => {
  const { data, protocolVersion } = event;
  const { args } = data;

  if (protocolVersion === 1) {
    const {
      filledMakerTokenAmount,
      filledTakerTokenAmount,
      makerToken,
      takerToken,
    } = args;

    return [
      {
        actor: FILL_ACTOR.MAKER,
        amount: filledMakerTokenAmount,
        tokenAddress: makerToken,
        tokenResolved: checkTokenResolved(makerToken),
        tokenType: TOKEN_TYPE.ERC20,
      },
      {
        actor: FILL_ACTOR.TAKER,
        amount: filledTakerTokenAmount,
        tokenAddress: takerToken,
        tokenResolved: checkTokenResolved(takerToken),
        tokenType: TOKEN_TYPE.ERC20,
      },
    ];
  }

  const {
    makerAssetData,
    makerAssetFilledAmount: makerAmount,
    takerAssetData,
    takerAssetFilledAmount: takerAmount,
  } = args;

  const mapToActor = actor => asset => ({
    ...asset,
    actor,
    tokenResolved: checkTokenResolved(asset.tokenAddress),
  });

  const mapToMaker = mapToActor(FILL_ACTOR.MAKER);
  const mapToTaker = mapToActor(FILL_ACTOR.TAKER);

  return []
    .concat(parseAssetData(makerAssetData, makerAmount).map(mapToMaker))
    .concat(parseAssetData(takerAssetData, takerAmount).map(mapToTaker));
};

module.exports = getAssets;
