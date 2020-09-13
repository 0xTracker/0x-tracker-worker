const mongoose = require('mongoose');

const { Schema } = mongoose;

const schema = Schema({
  address: String,
  description: String,
  isContract: Boolean,
  name: String,
});

const AddressMetadata = mongoose.model('AddressMetadata', schema);

module.exports = AddressMetadata;
