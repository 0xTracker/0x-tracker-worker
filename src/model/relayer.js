const mongoose = require('mongoose');

const { Schema } = mongoose;

const statsShape = {
  fees: {
    USD: Number,
    ZRX: String,
  },
  trades: Number,
  volume: Number,
  volumeShare: { type: Number, index: true },
};

const schema = mongoose.Schema({
  feeRecipients: [String],
  id: String,
  imageUrl: String,
  lookupId: { type: Number, index: true },
  name: String,
  orderMatcher: Boolean,
  prices: Schema.Types.Mixed,
  slug: String,
  stats: {
    '24h': statsShape,
    '7d': statsShape,
    '1m': statsShape,
  },
  takerAddresses: [String],
  url: String,
});

const Model = mongoose.model('Relayer', schema);

module.exports = Model;
