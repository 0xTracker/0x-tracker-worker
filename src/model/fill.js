const { Client } = require('@elastic/elasticsearch');
const { AmazonConnection } = require('aws-elasticsearch-connector');
const mongoose = require('mongoose');
const mongoosastic = require('mongoosastic');

const { FILL_STATUS } = require('../constants');

const { Schema } = mongoose;

const createModel = config => {
  const schema = Schema({
    assets: [
      {
        actor: Number,
        amount: Number,
        price: {
          USD: Number,
        },
        tokenAddress: { es_indexed: true, type: String },
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
        amount: { es_indexed: true, type: Number },
        makerFee: Number,
        protocolFee: Number,
        takerFee: Number,
      },
    },
    date: { es_indexed: true, type: Date },
    eventId: Schema.Types.ObjectId,
    fees: [
      {
        amount: { token: Number, USD: Number },
        tokenAddress: { es_index: true, type: String },
        tokenId: Number,
        traderType: Number,
      },
    ],
    feeRecipient: { es_indexed: true, type: String },
    hasValue: { default: false, type: Boolean },
    immeasurable: { default: false, type: Boolean },
    logIndex: Number,
    maker: { es_indexed: true, type: String },
    makerFee: Number,
    orderHash: { es_indexed: true, type: String },
    pricingStatus: Number,
    protocolFee: Number,
    protocolVersion: { es_indexed: true, type: Number },
    rates: {
      data: Schema.Types.Mixed,
    },
    relayerId: { es_indexed: true, type: Number },
    senderAddress: { es_indexed: true, type: String },
    status: {
      default: FILL_STATUS.PENDING,
      es_indexed: true,
      type: Number,
    },
    taker: { es_indexed: true, type: String },
    takerFee: Number,
    transactionHash: { es_indexed: true, type: String },
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

  schema.plugin(mongoosastic, {
    esClient: new Client({
      node: config.elasticsearchUrl,
      Connection: AmazonConnection,
      awsConfig: {
        credentials: {
          accessKeyId: config.elasticsearchAccessKeyId,
          secretAccessKey: config.elasticsearchAccessKeySecret,
        },
      },
    }),
    indexAutomatically: false,
  });

  const Model = mongoose.model('Fill', schema);

  return Model;
};

module.exports = createModel;
