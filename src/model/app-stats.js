const mongoose = require('mongoose');

const { Schema } = mongoose;

const schema = Schema({
  activeTraders: { required: true, type: Number },
  activeTradersChange: Number,
  appId: { required: true, type: String },
  appName: { required: true, type: String },
  period: String,
  relayedTrades: { required: true, type: Number },
  relayedTradesChange: Number,
  relayedVolume: { required: true, type: Number },
  relayedVolumeChange: Number,
  totalTrades: { required: true, type: Number },
  totalTradesChange: Number,
  totalVolume: { required: true, type: Number },
  totalVolumeChange: Number,
});

const AppStats = mongoose.model('AppStats', schema);

module.exports = AppStats;
