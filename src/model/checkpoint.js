const mongoose = require('mongoose');

const { Schema } = mongoose;

const schema = Schema({
  _id: { required: true, type: String },
  date: { required: true, type: Date },
  updatedAt: { required: true, type: Date },
});

const Checkpoint = mongoose.model('Checkpoint', schema);

module.exports = Checkpoint;
