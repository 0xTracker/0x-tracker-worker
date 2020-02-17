const activeTraderMetricsHourly = require('./active-trader-metrics-hourly');
const activeTraderMetricsDaily = require('./active-trader-metrics-daily');
const activeTraderMetricsWeekly = require('./active-trader-metrics-weekly');
const activeTraderMetricsMonthly = require('./active-trader-metrics-monthly');
const makerMetricsHourly = require('./maker-metrics-hourly');
const networkMetricsHourly = require('./network-metrics-hourly');
const protocolMetricsHourly = require('./protocol-metrics-hourly');
const relayerMetricsHourly = require('./relayer-metrics-hourly');
const takerMetricsHourly = require('./taker-metrics-hourly');
const traderMetricsHourly = require('./trader-metrics-hourly');
const unknownRelayerMetricsHourly = require('./unknown-relayer-metrics-hourly');

module.exports = [
  activeTraderMetricsDaily,
  activeTraderMetricsHourly,
  activeTraderMetricsMonthly,
  activeTraderMetricsWeekly,
  makerMetricsHourly,
  networkMetricsHourly,
  protocolMetricsHourly,
  relayerMetricsHourly,
  takerMetricsHourly,
  traderMetricsHourly,
  unknownRelayerMetricsHourly,
];
