const _ = require('lodash');

const createDocument = fill => {
  const value = _.get(fill, 'conversions.USD.amount');

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
    value: value === null ? undefined : value,
  };
};

module.exports = createDocument;
