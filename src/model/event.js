const mongoose = require('mongoose');

const { Schema } = mongoose;

const schema = Schema({
  blockNumber: Number,
  data: Schema.Types.Mixed,
  fillCreated: { type: Boolean, default: false },
  logIndex: Number,
  protocolVersion: Number,
  transactionHash: String,
  type: String,
});

schema.index({ fillCreated: 1 });
schema.index({ logIndex: 1, transactionHash: 1 }, { unique: true });

const Model = mongoose.model('Event', schema);

module.exports = Model;
