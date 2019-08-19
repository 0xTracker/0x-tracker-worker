const mongoose = require('mongoose');

const metricShape = {
  date: Date,
  fillCount: Number,
  fillVolume: Number,
};

const schema = mongoose.Schema({
  ...metricShape,
  address: String,
  date: { index: 1, type: Date },
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

schema.index({ address: 1, date: 1 }, { unique: true });

const Model = mongoose.model('AddressMetric', schema);

module.exports = Model;
