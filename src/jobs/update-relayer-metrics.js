const _ = require('lodash');
const moment = require('moment');
const signale = require('signale');

const computeRelayerMetrics = require('../metrics/compute-relayer-metrics');
const getDatesForMetricsJob = require('../metrics/get-dates-for-metrics-job');
const MetricsJobMetadata = require('../model/metrics-job-metadata');
const RelayerMetric = require('../model/relayer-metric');
const withTransaction = require('../util/with-transaction');

const logger = signale.scope('update relayer metrics');

const updateRelayerMetrics = async () => {
  const dates = await getDatesForMetricsJob('relayer');

  if (dates === null) {
    logger.info('no metrics available to update');
    return;
  }

  logger.time('compute metrics');
  const results = await Promise.all(
    dates.map(date => {
      return computeRelayerMetrics(date);
    }),
  );
  logger.timeEnd('compute metrics');

  const metrics = _.flatten(results);

  logger.time('persist metrics');
  await withTransaction(async session => {
    await RelayerMetric.bulkWrite(
      metrics.map(metric => ({
        updateOne: {
          filter: { date: metric.date, relayerId: metric.relayerId },
          update: { $set: metric },
          upsert: true,
        },
      })),
      { session },
    );

    await MetricsJobMetadata.bulkWrite(
      dates.map(date => ({
        updateOne: {
          filter: { date, metricType: 'relayer' },
          update: {
            $set: {
              date,
              metricType: 'relayer',
              lastUpdated: Date.now(),
            },
          },
          upsert: true,
        },
      })),
      { session },
    );
  });
  logger.timeEnd('persist metrics');

  logger.success(
    `updated relayer metrics for dates: ${_.join(
      dates.map(date => moment(date).format('DD/MM/YYYY')),
      ', ',
    )}`,
  );
};

module.exports = updateRelayerMetrics;
