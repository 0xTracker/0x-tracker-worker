const _ = require('lodash');

const relayerRegistry = require('../../relayers/relayer-registry');

const isOrderMatcher = relayerId => {
  const relayer = _(relayerRegistry)
    .values()
    .find({ lookupId: relayerId });

  return _.get(relayer, 'orderMatcher', false);
};

const calculateTradeVolume = (value, relayerId) => {
  if (isOrderMatcher(relayerId)) {
    return value / 2;
  }

  return value;
};

const calculateTradeCountContribution = relayerId => {
  if (isOrderMatcher(relayerId)) {
    return 0.5;
  }

  return 1;
};

const createDocument = fill => {
  const value = _.get(fill, 'conversions.USD.amount');
  const protocolFeeUSD = _.get(fill, 'conversions.USD.protocolFee');

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
    maker: fill.maker,
    orderHash: fill.orderHash,
    protocolFeeETH: fill.protocolFee,
    protocolFeeUSD,
    protocolVersion: fill.protocolVersion,
    relayerId: fill.relayerId,
    senderAddress: fill.senderAddress,
    status: fill.status,
    taker: fill.taker,
    transactionHash: fill.transactionHash,
    transactionFrom: fill.transaction.from,
    transactionTo: fill.transaction.to,
    updatedAt: new Date(Date.now()).toISOString(),
    value: value === null ? undefined : value,

    // This field helps to compute traderCount by allowing for cardinality
    // aggregation over maker & taker values.
    traders: _.compact([
      fill.maker,
      fill.takerMetadata.isContract ? fill.transaction.from : fill.taker,
    ]),

    // These fields help to compute tradeVolume and tradeCount metrics in
    // Elasticsearch without the need for a 'trades' index.
    tradeVolume: calculateTradeVolume(value, fill.relayerId),
    tradeCountContribution: calculateTradeCountContribution(fill.relayerId),
  };
};

module.exports = createDocument;
