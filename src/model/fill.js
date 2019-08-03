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
      tokenAddress: String,
      tokenId: Number,
      tokenResolved: { default: false, type: Boolean },
    },
  ],
  blockHash: String,
  blockNumber: Number,
  conversions: {
    USD: {
      amount: Number,
      makerFee: Number,
      takerFee: Number,
    },
  },
  date: Date,
  eventId: Schema.Types.ObjectId,
  feeRecipient: String,
  hasValue: { default: false, type: Boolean },
  immeasurable: { default: false, type: Boolean },
  logIndex: Number,
  maker: String,
  makerFee: Number,
  orderHash: String,
  prices: {
    saved: { default: false, type: Boolean },
  },
  protocolVersion: Number,
  rates: {
    data: Schema.Types.Mixed,
  },
  relayerId: Number,
  senderAddress: String,
  status: {
    default: FILL_STATUS.PENDING,
    type: Number,
  },
  taker: String,
  takerFee: Number,
  transactionHash: String,
});

// TODO: Work out what this index was for. Sorting?
schema.index({ date: -1 });

// Used for searching fills
schema.index({ feeRecipient: 1 });
schema.index({ maker: 1 });
schema.index({ orderHash: 1 });
schema.index({ senderAddress: 1 });
schema.index({ taker: 1 });
schema.index({ transactionHash: 1 });

// Used for fetching fills related to a particular token
schema.index({ 'assets.tokenAddress': 1, date: -1 });

// Used by convert-fees job
schema.index({ 'conversions.USD.makerFee': 1 });
schema.index({ 'conversions.USD.takerFee': 1 });

// Used to enforce data integrity
schema.index({ logIndex: 1, transactionHash: 1 }, { unique: true });

// Used for fetching fills associated with a particular relayer
schema.index({ relayerId: 1, date: -1 });

// Used for fetching fills associated with a particular token
schema.index({ 'assets.tokenAddress': 1, date: -1 });

// Used by determine-fill-values job
schema.index({ hasValue: 1, 'assets.tokenAddress': 1, immeasurable: -1 });

// Used by derive-fill-prices job
schema.index({
  hasValue: -1,
  'prices.saved': 1,
  'assets.tokenResolved': -1,
});

// Used by update-fill-statuses job
schema.index({ status: 1 });

const Model = mongoose.model('Fill', schema);

module.exports = Model;
