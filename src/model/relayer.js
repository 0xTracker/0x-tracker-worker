const mongoose = require('mongoose');

const schema = mongoose.Schema({
  feeRecipients: [String],
  id: String,
  imageUrl: String,
  lookupId: { type: Number, index: true },
  name: String,
  orderMatcher: Boolean,
  slug: String,
  takerAddresses: [String],
  url: String,
});

schema.index({ slug: 1 }, { unique: true });

const Model = mongoose.model('Relayer', schema);

module.exports = Model;
