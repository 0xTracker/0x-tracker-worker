const _ = require('lodash');

const { TRADER_TYPE } = require('../constants');
const parseAssetData = require('../util/parse-asset-data');

const createFeeAssetMapper = traderType => asset => ({
  ...asset,
  amount: { token: asset.amount },
  traderType,
});

const mapMakerFeeAsset = createFeeAssetMapper(TRADER_TYPE.MAKER);
const mapTakerFeeAsset = createFeeAssetMapper(TRADER_TYPE.TAKER);

const getFeesForEvent = event => {
  const { data, protocolVersion } = event;
  const { args } = data;
  const { makerFeePaid, takerFeePaid } = args;

  if (event.protocolVersion < 3) {
    const { paidMakerFee, paidTakerFee } = args;
    const makerFee = protocolVersion === 1 ? paidMakerFee : makerFeePaid;
    const takerFee = protocolVersion === 1 ? paidTakerFee : takerFeePaid;

    return _.compact([
      makerFee > 0
        ? {
            amount: {
              token: makerFee,
            },
            tokenAddress: '0xe41d2489571d322189246dafa5ebde1f4699f498',
            tokenType: 0,
            traderType: 0,
          }
        : undefined,
      takerFee > 0
        ? {
            amount: {
              token: takerFee,
            },
            tokenAddress: '0xe41d2489571d322189246dafa5ebde1f4699f498',
            tokenType: 0,
            traderType: 1,
          }
        : undefined,
    ]);
  }

  const { makerFeeAssetData, takerFeeAssetData } = args;
  const makerFeeAssets = parseAssetData(makerFeeAssetData, makerFeePaid);
  const takerFeeAssets = parseAssetData(takerFeeAssetData, takerFeePaid);

  if (makerFeeAssets === undefined || takerFeeAssets === undefined) {
    return undefined;
  }

  const makerFees = makerFeeAssets.map(mapMakerFeeAsset);
  const takerFees = takerFeeAssets.map(mapTakerFeeAsset);
  const fees = makerFees.concat(takerFees).filter(fee => fee.amount.token > 0);

  return fees;
};

module.exports = getFeesForEvent;
