const _ = require('lodash');
const { FILL_ATTRIBUTION_TYPE } = require('../constants');
const getTradeCountContribution = require('../fills/get-trade-count-contribution');
const getTraderAddresses = require('../fills/get-trader-addresses');

const getDocumentForFillsIndex = fill => {
  const value = _.get(fill, 'conversions.USD.amount');
  const protocolFeeUSD = _.get(fill, 'conversions.USD.protocolFee');
  const liquiditySource = _.find(
    fill.attributions,
    a => a.type === FILL_ATTRIBUTION_TYPE.LIQUIDITY_SOURCE,
  );

  const tradeCountContribution = getTradeCountContribution(fill);

  return {
    affiliateAddress: fill.affiliateAddress,
    attributions: fill.attributions.map(attribution => ({
      id: attribution.entityId,
      type: attribution.type,
    })),
    assets: fill.assets.map(asset => ({
      bridgeAddress: asset.bridgeAddress,
      tokenAddress: asset.tokenAddress,
    })),
    date: fill.date,
    fees: fill.fees.map(fee => ({ tokenAddress: fee.tokenAddress })),
    feeRecipient: fill.feeRecipient,
    liquiditySourceId: liquiditySource ? liquiditySource.entityId : undefined,
    maker: fill.maker,
    orderHash: fill.orderHash,
    protocolFeeETH: fill.protocolFee,
    protocolFeeUSD,
    protocolVersion: fill.protocolVersion,
    senderAddress: fill.senderAddress,
    taker: fill.taker,
    transactionHash: fill.transactionHash,
    transactionFrom: fill.transaction.from,
    transactionTo: fill.transaction.to,
    value: value === null ? undefined : value,

    // This field helps to compute traderCount by allowing for cardinality
    // aggregation over maker & taker values.
    traders: getTraderAddresses(fill),

    // These fields help to compute tradeVolume and tradeCount metrics in
    // Elasticsearch without the need for a 'trades' index.
    tradeVolume: value === null ? undefined : value * tradeCountContribution,
    tradeCountContribution,
  };
};

module.exports = getDocumentForFillsIndex;
