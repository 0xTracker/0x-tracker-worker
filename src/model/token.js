const mongoose = require('mongoose');

const { Schema } = mongoose;

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
  symbol: String,
});

const Model = mongoose.model('Token', schema);

module.exports = Model;
