const _ = require('lodash');

const { FILL_ACTOR } = require('../constants');
const { checkTokenResolved } = require('../tokens/token-cache');
const parseAssetData = require('../util/parse-asset-data');

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

  const assets = parseAssetData(encodedData, amount);

  if (assets === undefined) {
    return undefined;
  }

  return assets.map(asset => ({ ...asset, actor }));
};

const getV2AssetsForEvent = event => {
  const eventArgs = event.data.args;
  const assets = _([FILL_ACTOR.MAKER, FILL_ACTOR.TAKER])
    .map(actor => getAssetsForActor(eventArgs, actor))
    .flatten()
    .value();

  if (assets.some(asset => asset === undefined)) {
    return undefined;
  }

  return assets.map(asset => ({
    ...asset,
    tokenResolved: checkTokenResolved(asset.tokenAddress),
  }));
};

module.exports = getV2AssetsForEvent;
