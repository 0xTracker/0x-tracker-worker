const mongoose = require('mongoose');

const schema = mongoose.Schema({
  author: String,
  content: String,
  date: Date,
  feed: String,
  guid: String,
  metadata: mongoose.Schema.Types.Mixed,
  slug: String,
  summary: String,
  title: String,
  url: String,
});

schema.index({ date: -1 });
schema.index({ feed: 1, date: -1 });
schema.index({ guid: 1 }, { unique: true });

const Model = mongoose.model('Article', schema);

module.exports = Model;
