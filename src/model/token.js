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
  address: { type: String, index: true, unique: true },
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
  stats: {
    '1m': statsShape,
    '7d': statsShape,
    '24h': statsShape,
  },
  symbol: String,
});

const Model = mongoose.model('Token', schema);

module.exports = Model;
