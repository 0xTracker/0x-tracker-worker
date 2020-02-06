const _ = require('lodash');

const relayerRegistry = require('../../relayers/relayer-registry');

const isPartialTrade = relayerId => {
  const relayer = _.isEmpty(relayerId)
    ? null
    : _.find(relayerRegistry, { lookupId: relayerId });

  return _.get(relayer, 'orderMatcher', false);
};

const createDocument = fill => {
  const value = _.get(fill, 'conversions.USD.amount');
  const partialTrade = isPartialTrade(fill.relayerId);

  return {
    assets: fill.assets.map(asset => ({
      bridgeAddress: asset.bridgeAddress,
      tokenAddress: asset.tokenAddress,
    })),
    date: fill.date,
    fees: fill.fees.map(fee => ({ tokenAddress: fee.tokenAddress })),
    feeRecipient: fill.feeRecipient,
    maker: fill.maker,
    orderHash: fill.orderHash,
    protocolVersion: fill.protocolVersion,
    relayerId: fill.relayerId,
    senderAddress: fill.senderAddress,
    status: fill.status,
    taker: fill.taker,
    transactionHash: fill.transactionHash,
    updatedAt: Date.now(),
    value: value === null ? undefined : value,

    // This field helps to compute traderCount by allowing for cardinality
    // aggregation over maker & taker values.
    traders: [fill.maker, fill.taker],

    // These fields help to compute tradeVolume and tradeCount metrics in
    // Elasticsearch without the need for a 'trades' index.
    tradeVolume: partialTrade && value !== null ? value / 2 : value,
    tradeCountContribution: partialTrade ? 0.5 : 1,
  };
};

module.exports = createDocument;
