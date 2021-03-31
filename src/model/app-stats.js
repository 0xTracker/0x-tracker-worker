const mongoose = require('mongoose');

const { Schema } = mongoose;

const schema = Schema({
  activeTraders: { required: true, type: Number },
  appId: { required: true, type: String },
  appName: { required: true, type: String },
  periodInDays: { type: Number },
  relayedTrades: { required: true, type: Number },
  relayedVolume: { required: true, type: Number },
  totalTrades: { required: true, type: Number },
  totalVolume: { required: true, type: Number },
});

const AppStats = mongoose.model('AppStats', schema);

module.exports = AppStats;
