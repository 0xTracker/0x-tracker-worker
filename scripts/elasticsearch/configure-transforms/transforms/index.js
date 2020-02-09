const networkMetricsHourly = require('./network-metrics-hourly');
const protocolMetricsHourly = require('./protocol-metrics-hourly');
const relayerMetricsHourly = require('./relayer-metrics-hourly');
const traderMetricsHourly = require('./trader-metrics-hourly');
const unknownRelayerMetricsHourly = require('./unknown-relayer-metrics-hourly');

module.exports = [
  networkMetricsHourly,
  protocolMetricsHourly,
  relayerMetricsHourly,
  traderMetricsHourly,
  unknownRelayerMetricsHourly,
];
