const mongoose = require('mongoose');

const { Schema } = mongoose;

const statsShape = {
  trades: Number,
  volume: {
    token: String,
    USD: Number,
  },
  volumeShare: { type: Number, index: true },
};

const schema = Schema({
  address: String,
  decimals: Number,
  imageUrl: { type: String, trim: true },
  name: String,
  price: {
    lastTrade: {
      date: Date,
      id: { type: Schema.Types.ObjectId, Ref: 'Fill' },
    },
    lastPrice: Number,
  },
  resolved: Boolean,
  stats: {
    '1m': statsShape,
    '7d': statsShape,
    '24h': statsShape,
  },
  symbol: String,
  type: Number,
});

schema.index({ address: 1 }, { unique: true });
schema.index({ resolved: 1 });
schema.index({ type: 1 });

const Model = mongoose.model('Token', schema);

module.exports = Model;
