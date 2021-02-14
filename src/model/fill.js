const mongoose = require('mongoose');

const { FILL_STATUS } = require('../constants');

const { Schema } = mongoose;

const schema = Schema(
  {
    affiliateAddress: { lowercase: true, trim: true, type: String },
    attributions: [
      {
        entityId: String,
        type: { type: Number },
      },
    ],
    assets: [
      {
        actor: Number,
        amount: Number,
        bridgeAddress: { lowercase: true, trim: true, type: String },
        bridgeData: String,
        price: {
          USD: Number,
        },
        tokenAddress: {
          lowercase: true,
          required: true,
          trim: true,
          type: String,
        },
        tokenId: Number,
        tokenResolved: { default: false, type: Boolean },
        value: {
          USD: Number,
        },
      },
    ],
    blockHash: { lowercase: true, required: true, trim: true, type: String },
    blockNumber: Number,
    conversions: {
      USD: {
        amount: Number,
        protocolFee: Number,
      },
    },
    date: Date,
    eventId: Schema.Types.ObjectId,
    fees: [
      {
        amount: { token: Number, USD: Number },
        bridgeAddress: { lowercase: true, trim: true, type: String },
        bridgeData: String,
        tokenAddress: {
          lowercase: true,
          required: true,
          trim: true,
          type: String,
        },
        tokenId: Number,
        traderType: Number,
      },
    ],
    feeRecipient: { lowercase: true, trim: true, type: String },
    hasValue: { default: false, type: Boolean },
    immeasurable: { default: false, type: Boolean },
    isTransformedERC20: { type: Boolean },
    logIndex: Number,
    maker: { lowercase: true, trim: true, type: String },
    orderHash: { lowercase: true, trim: true, type: String },
    pool: String,
    pricingStatus: Number,
    protocolFee: Number,
    protocolVersion: Number,
    quoteDate: Date,
    rates: {
      data: Schema.Types.Mixed,
    },
    relayerId: Number,
    senderAddress: { lowercase: true, trim: true, type: String },
    source: String,
    // TODO: Remove this field from everywhere in app, it's redundant now
    status: {
      default: FILL_STATUS.SUCCESSFUL,
      type: Number,
    },

    taker: { lowercase: true, required: true, trim: true, type: String },
    transactionHash: {
      lowercase: true,
      required: true,
      trim: true,
      type: String,
    },
    type: { type: Number },
  },
  { toJSON: { virtuals: true } },
);

// TODO: Work out what this index was for. Sorting?
schema.index({ date: -1 });

// Used for fetching fills related to a particular token
schema.index({ 'assets.tokenAddress': 1, date: -1 });

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
  pricingStatus: 1,
  'assets.tokenResolved': -1,
});

schema.virtual('assets.token', {
  ref: 'Token',
  localField: 'assets.tokenAddress',
  foreignField: 'address',
  justOne: true,
});

schema.virtual('fees.token', {
  ref: 'Token',
  localField: 'fees.tokenAddress',
  foreignField: 'address',
  justOne: true,
});

schema.virtual('relayer', {
  ref: 'Relayer',
  localField: 'relayerId',
  foreignField: 'lookupId',
  justOne: true,
});

schema.virtual('takerMetadata', {
  ref: 'AddressMetadata',
  localField: 'taker',
  foreignField: 'address',
  justOne: true,
});

schema.virtual('transaction', {
  ref: 'Transaction',
  localField: 'transactionHash',
  foreignField: 'hash',
  justOne: true,
});

const Model = mongoose.model('Fill', schema);

module.exports = Model;
