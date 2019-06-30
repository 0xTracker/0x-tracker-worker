const mongoose = require('mongoose');

const metricShape = {
  date: Date,
  fillCount: Number,
  tokenVolume: Number,
  usdVolume: Number,
};

const schema = mongoose.Schema({
  ...metricShape,
  date: { index: true, type: Date },
  tokenAddress: { index: true, type: String },
  hours: [
    {
      ...metricShape,
      minutes: [
        {
          ...metricShape,
        },
      ],
    },
  ],
});

schema.index({ tokenAddress: 1, date: 1 }, { unique: true });

const Model = mongoose.model('TokenMetric', schema);

module.exports = Model;
