const _ = require('lodash');
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

schema.virtual('tradeCountContribution').get(() => {
  const { relayerId, relayer } = this;

  if (_.isNil(relayer) && !_.isNil(relayerId)) {
    throw new Error(`Relayer not populated for fill: ${this._id}`);
  }

  if (_.get(relayer, 'orderMatcher', false)) {
    return 0.5;
  }

  return 1;
});

const Model = mongoose.model('Relayer', schema);

module.exports = Model;
