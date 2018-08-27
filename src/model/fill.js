const mongoose = require('mongoose');

const { Schema } = mongoose;

const schema = Schema({
  blockHash: String,
  blockNumber: Number,
  conversions: {
    USD: {
      amount: Number,
      makerFee: Number,
      makerPrice: Number,
      takerFee: Number,
      takerPrice: Number,
    },
  },
  date: { type: Date, index: -1 },
  feeRecipient: { type: String, index: true },
  logIndex: { type: Number, index: true },
  maker: { type: String, index: true },
  makerAmount: Number,
  makerFee: Number,
  makerToken: { type: String, index: true },
  orderHash: String,
  prices: {
    maker: Number,
    taker: Number,
    saved: { default: false, type: Boolean, index: true },
  },
  rates: {
    data: Schema.Types.Mixed,
    saved: { default: false, type: Boolean, index: true },
  },
  relayerId: { type: Number, index: true },
  roundedDates: {
    day: { type: Date, index: -1 },
    halfHour: { type: Date, index: -1 },
    hour: { type: Date, index: -1 },
    minute: { type: Date, index: -1 },
  },
  status: {
    default: 0, // pending
    type: Number,
  },
  taker: { type: String, index: true },
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

const Model = mongoose.model('Fill', schema);

module.exports = Model;
