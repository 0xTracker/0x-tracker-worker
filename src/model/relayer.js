const mongoose = require('mongoose');

const { Schema } = mongoose;

const schema = mongoose.Schema({
  lookupId: { type: Number, index: true },
  prices: Schema.Types.Mixed,
});

const Model = mongoose.model('Relayer', schema);

module.exports = Model;
