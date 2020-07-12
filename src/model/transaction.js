const mongoose = require('mongoose');

const { Schema } = mongoose;

const schema = Schema({
  affiliateAddress: String,
  blockHash: String,
  blockNumber: Number,
  data: String,
  date: Date,
  from: String,
  gasLimit: Number,
  gasPrice: String,
  gasUsed: Number,
  hash: String,
  index: Number,
  nonce: String,
  quoteDate: Date,
  to: String,
  value: String,
});

const Transaction = mongoose.model('Transaction', schema);

module.exports = Transaction;
