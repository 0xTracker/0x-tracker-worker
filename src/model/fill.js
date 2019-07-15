const mongoose = require('mongoose');

const { FILL_STATUS } = require('../constants');

const { Schema } = mongoose;

const schema = Schema({
  blockHash: String,
  blockNumber: Number,
  conversions: {
    USD: {
      amount: Number,
      makerFee: { type: Number, index: true },
      makerPrice: Number,
      takerFee: { type: Number, index: true },
      takerPrice: Number,
    },
  },
  date: { type: Date, index: -1 },
  feeRecipient: { type: String, index: true },
  logIndex: Number,
  maker: { type: String, index: true },
  makerAsset: {
    assetProxyId: String,
    tokenAddress: String,
    tokenId: Number,
  },
  makerAmount: Number,
  makerFee: Number,
  makerToken: { type: String, index: true },
  orderHash: { type: String, index: true },
  prices: {
    maker: Number,
    taker: Number,
    saved: { default: false, type: Boolean, index: true },
  },
  protocolVersion: Number,
  rates: {
    data: Schema.Types.Mixed,
    saved: { default: false, type: Boolean, index: true },
  },
  relayerId: { type: Number, index: true },
  senderAddress: { type: String, index: true },
  status: {
    default: FILL_STATUS.PENDING,
    type: Number,
  },
  taker: { type: String, index: true },
  takerAsset: {
    assetProxyId: String,
    tokenAddress: String,
    tokenId: Number,
  },
  takerAmount: Number,
  takerFee: Number,
  takerToken: { type: String, index: true },
  tokenSaved: {
    maker: { type: Boolean, index: true },
    taker: { type: Boolean, index: true },
  },
  transactionHash: { type: String, index: true },
});

schema.index({ logIndex: 1, transactionHash: 1 }, { unique: true });
schema.index({ makerFee: 1, takerFee: 1 });

const Model = mongoose.model('Fill', schema);

module.exports = Model;
