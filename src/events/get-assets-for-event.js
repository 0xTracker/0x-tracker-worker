const { FILL_ACTOR } = require('../constants');
const { checkTokenResolved } = require('../tokens/token-cache');
const parseAssetData = require('../util/parse-asset-data');

const getAssets = event => {
  const { data } = event;
  const { args } = data;

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
