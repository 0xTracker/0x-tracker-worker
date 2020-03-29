const mongoose = require('mongoose');

const { Schema } = mongoose;

const schema = Schema(
  {
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
    symbol: String,
    type: Number,
  },
  { timestamps: true },
);

schema.index({ address: 1 }, { unique: true });
schema.index({ resolved: 1 });
schema.index({ type: 1 });

const Model = mongoose.model('Token', schema);

module.exports = Model;
