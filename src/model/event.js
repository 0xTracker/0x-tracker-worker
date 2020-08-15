const mongoose = require('mongoose');

const { Schema } = mongoose;

const schema = Schema(
  {
    blockNumber: { immutable: true, required: true, type: Number },
    dateIngested: {
      default: Date.now,
      immutable: true,
      required: true,
      type: Date,
    },
    data: { required: true, type: Schema.Types.Mixed },
    fillCreated: { type: Boolean },
    logIndex: { immutable: true, required: true, type: Number },
    protocolVersion: { immutable: true, required: true, type: Number },
    scheduler: {
      fillCreationScheduled: Boolean,
      transactionFetchScheduled: Boolean,
    },
    transactionHash: { immutable: true, required: true, type: String },
    type: { immutable: true, required: true, type: String },
  },
  { strict: 'throw' },
);

schema.index({ fillCreated: 1 });
schema.index({ logIndex: 1, transactionHash: 1 }, { unique: true });

const Model = mongoose.model('Event', schema);

module.exports = Model;
