const mongoose = require('mongoose');

const { FILL_STATUS } = require('../constants');

const { Schema } = mongoose;

const createModel = () => {
  const schema = Schema(
    {
      assets: [
        {
          actor: Number,
          amount: Number,
          bridgeAddress: String,
          bridgeData: String,
          price: {
            USD: Number,
          },
          tokenAddress: String,
          tokenId: Number,
          tokenResolved: { default: false, type: Boolean },
          value: {
            USD: Number,
          },
        },
      ],
      blockHash: String,
      blockNumber: Number,
      conversions: {
        USD: {
          amount: Number,
          makerFee: Number,
          protocolFee: Number,
          takerFee: Number,
        },
      },
      date: Date,
      eventId: Schema.Types.ObjectId,
      fees: [
        {
          amount: { token: Number, USD: Number },
          bridgeAddress: String,
          bridgeData: String,
          tokenAddress: String,
          tokenId: Number,
          traderType: Number,
        },
      ],
      feeRecipient: String,
      hasValue: { default: false, type: Boolean },
      immeasurable: { default: false, type: Boolean },
      logIndex: Number,
      maker: String,
      makerFee: Number,
      orderHash: String,
      pricingStatus: Number,
      protocolFee: Number,
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
    },
    { toJSON: { virtuals: true } },
  );

  // TODO: Work out what this index was for. Sorting?
  schema.index({ date: -1 });

  // Used for fetching fills related to a particular token
  schema.index({ 'assets.tokenAddress': 1, date: -1 });

  // Used by convert-fees job
  schema.index({ 'conversions.USD.makerFee': 1 });
  schema.index({ 'conversions.USD.takerFee': 1 });
  schema.index({ 'conversions.USD.protocolFee': 1, protocolVersion: 1 });

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

  const Model = mongoose.model('Fill', schema);

  return Model;
};

module.exports = createModel;
