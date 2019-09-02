const mongoose = require('mongoose');

const schema = mongoose.Schema({
  author: String,
  date: Date,
  feed: String,
  guid: String,
  summary: String,
  title: String,
  url: String,
});

schema.index({ date: -1 });
schema.index({ feed: 1, date: -1 });
schema.index({ guid: 1 }, { unique: true });

const Model = mongoose.model('Article', schema);

module.exports = Model;
