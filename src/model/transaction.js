const mongoose = require('mongoose');

const { Schema } = mongoose;

const schema = Schema({
  affiliateAddress: String,
  blockHash: String,
  blockNumber: Number,
  data: String,
  from: String,
  gasLimit: Number,
  gasPrice: String,
  gasUsed: Number,
  hash: String,
  index: Number,
  nonce: String,
  quoteTimestamp: Date,
  timestamp: Date,
  to: String,
  value: String,
});

const Transaction = mongoose.model('Transaction', schema);

module.exports = Transaction;
