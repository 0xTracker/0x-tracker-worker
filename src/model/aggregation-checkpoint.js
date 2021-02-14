const mongoose = require('mongoose');

const { Schema } = mongoose;

const schema = Schema({
  _id: String,
  date: Date,
  previous: Date,
  progressData: Schema.Types.Mixed,
  complete: Boolean,
});

const AggregationCheckpoint = mongoose.model('AggregationCheckpoint', schema);

module.exports = AggregationCheckpoint;
