const mongoose = require('mongoose');

const { FILL_STATUS } = require('../constants');

const { Schema } = mongoose;

const schema = Schema({
  assets: [
    {
      actor: Number,
      amount: Number,
      price: {
        USD: Number,
      },
      tokenAddress: { type: String, index: true },
      tokenId: Number,
      tokenResolved: { default: false, type: Boolean },
    },
  ],
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
  eventId: Schema.Types.ObjectId,
  feeRecipient: { type: String, index: true },
  hasValue: { default: false, type: Boolean },
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
    saved: { default: false, type: Boolean },
  },
  protocolVersion: Number,
  rates: {
    data: Schema.Types.Mixed,
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
    maker: Boolean,
    taker: Boolean,
  },
  transactionHash: { type: String, index: true },
});

// Used for data integrity
schema.index({ logIndex: 1, transactionHash: 1 }, { unique: true });

// Used for fetching fills associated with a particular relayer
schema.index({ relayerId: 1, date: -1 });

// Used by determine-fill-values job
schema.index({ hasValue: 1, 'assets.tokenAddress': 1 });

// Used by derive-fill-prices job
schema.index({
  hasValue: -1,
  'prices.saved': 1,
  'tokenSaved.maker': -1,
  'tokenSaved.taker': -1,
});

const Model = mongoose.model('Fill', schema);

module.exports = Model;
