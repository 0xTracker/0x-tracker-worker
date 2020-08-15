const mongoose = require('mongoose');

const { Schema } = mongoose;

const schema = Schema(
  {
    address: { lowercase: true, required: true, trim: true, type: String },
    circulatingSupply: Number,
    decimals: Number,
    imageUrl: { type: String, trim: true },
    name: String,
    resolved: { default: false, type: Boolean },
    symbol: String,
    totalSupply: Number,
    type: { required: true, type: Number },
  },
  { strict: true, timestamps: true },
);

schema.index({ address: 1 }, { unique: true });
schema.index({ resolved: 1 });
schema.index({ type: 1 });

const Model = mongoose.model('Token', schema);

module.exports = Model;
