const mongoose = require('mongoose');

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
  slug: String,
  stats: {
    '24h': statsShape,
    '7d': statsShape,
    '1m': statsShape,
  },
  takerAddresses: [String],
  url: String,
});

schema.index({ slug: 1 }, { unique: true });

const Model = mongoose.model('Relayer', schema);

module.exports = Model;
