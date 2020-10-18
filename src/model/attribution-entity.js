const mongoose = require('mongoose');

const schema = mongoose.Schema({
  _id: { required: true, type: String },
  categories: [{ required: true, type: String }],
  description: { type: String },
  logoUrl: { required: true, type: String },
  mappings: [
    {
      affiliateAddress: String,
      feeRecipientAddress: String,
      senderAddress: String,
      takerAddress: String,
      type: { required: true, type: Number },
    },
  ],
  name: { required: true, type: String },
  urlSlug: { required: true, type: String },
  websiteUrl: String,
});

const AttributionEntity = mongoose.model('AttributionEntity', schema);

module.exports = AttributionEntity;
