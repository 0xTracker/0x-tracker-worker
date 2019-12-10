const createDocument = fill => ({
  assets: fill.assets.map(asset => ({ tokenAddress: asset.tokenAddress })),
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
});

module.exports = createDocument;
