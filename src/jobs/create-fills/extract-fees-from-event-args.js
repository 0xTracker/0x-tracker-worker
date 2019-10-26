const { TRADER_TYPE } = require('../../constants');
const parseAssetData = require('./parse-asset-data');

const createFeeAssetMapper = traderType => asset => ({
  ...asset,
  amount: { token: asset.amount },
  traderType,
});

const mapMakerFeeAsset = createFeeAssetMapper(TRADER_TYPE.MAKER);
const mapTakerFeeAsset = createFeeAssetMapper(TRADER_TYPE.TAKER);

const getFees = (eventArgs, protocolVersion) => {
  if (protocolVersion < 3) {
    return undefined;
  }

  const {
    makerFeeAssetData,
    makerFeePaid,
    takerFeeAssetData,
    takerFeePaid,
  } = eventArgs;

  const makerFeeAssets = parseAssetData(makerFeeAssetData, makerFeePaid);
  const takerFeeAssets = parseAssetData(takerFeeAssetData, takerFeePaid);

  if (makerFeeAssets === undefined || takerFeeAssets === undefined) {
    return undefined;
  }

  const makerFees = makerFeeAssets.map(mapMakerFeeAsset);
  const takerFees = takerFeeAssets.map(mapTakerFeeAsset);
  const fees = makerFees.concat(takerFees);

  return fees;
};

module.exports = getFees;
