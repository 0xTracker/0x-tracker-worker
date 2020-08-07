const mongoose = require('mongoose');

const { Schema } = mongoose;

const schema = Schema({
  blockNumber: { required: true, type: Number },
  data: { required: true, type: Schema.Types.Mixed },
  fillCreated: { type: Boolean },
  logIndex: { required: true, type: Number },
  protocolVersion: { required: true, type: Number },
  scheduler: {
    transactionFetchScheduled: Boolean,
  },
  transactionHash: { required: true, type: String },
  type: { required: true, type: String },
});

schema.index({ fillCreated: 1 });
schema.index({ logIndex: 1, transactionHash: 1 }, { unique: true });

const Model = mongoose.model('Event', schema);

module.exports = Model;
