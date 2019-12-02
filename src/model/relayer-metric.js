const mongoose = require('mongoose');

const metricShape = {
  date: { index: true, type: Date },
  fees: {
    USD: Number,
    ZRX: Number,
  },
  fillCount: Number,
  fillVolume: Number,
  protocolFees: {
    USD: Number,
    ZRX: Number,
  },
  tradeCount: Number,
  tradeVolume: Number,
};

const schema = mongoose.Schema({
  ...metricShape,
  relayerId: { index: true, type: Number },
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

schema.index({ relayerId: 1, date: 1 }, { unique: true });

const Model = mongoose.model('RelayerMetric', schema);

module.exports = Model;
