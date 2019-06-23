const mongoose = require('mongoose');

const schema = mongoose.Schema({
  date: Date,
  metricType: String,
  lastUpdated: Date,
  timeTaken: Number,
});

schema.index({ date: 1, metricType: 1 }, { unique: true });

const Model = mongoose.model('MetricsJobMetadata', schema);

module.exports = Model;
