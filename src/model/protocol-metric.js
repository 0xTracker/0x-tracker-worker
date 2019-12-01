const mongoose = require('mongoose');

const { Schema } = mongoose;

const metricShape = {
  date: Date,
  fillCount: Schema.Types.Mixed,
  fillVolume: Schema.Types.Mixed,
};

const schema = mongoose.Schema({
  ...metricShape,
  protocolVersion: Number,
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

schema.index({ protocolVersion: 1, date: 1 }, { unique: true });

const Model = mongoose.model('ProtocolMetric', schema);

module.exports = Model;
