const _ = require('lodash');
const moment = require('moment');
const signale = require('signale');

const computeProtocolMetrics = require('../metrics/compute-protocol-metrics');
const getDatesForMetricsJob = require('../metrics/get-dates-for-metrics-job');
const MetricsJobMetadata = require('../model/metrics-job-metadata');
const ProtocolMetric = require('../model/protocol-metric');
const withTransaction = require('../util/with-transaction');

const logger = signale.scope('cache protocol metrics');

const cacheProtocolMetrics = async () => {
  const dates = await getDatesForMetricsJob('protocol');

  if (dates === null) {
    logger.info('no metrics available to update');
    return;
  }

  logger.time('compute metrics');
  const results = await Promise.all(
    dates.map(date => {
      return computeProtocolMetrics(date);
    }),
  );
  logger.timeEnd('compute metrics');

  const metrics = _.flatten(results);

  logger.time('persist metrics');
  await withTransaction(async session => {
    if (metrics.length > 0) {
      await ProtocolMetric.bulkWrite(
        metrics.map(metric => ({
          updateOne: {
            filter: {
              date: metric.date,
              protocolVersion: metric.protocolVersion,
            },
            update: { $set: metric },
            upsert: true,
          },
        })),
        { session },
      );
    }

    await MetricsJobMetadata.bulkWrite(
      dates.map(date => ({
        updateOne: {
          filter: { date, metricType: 'protocol' },
          update: {
            $set: {
              date,
              metricType: 'protocol',
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
    `updated metrics for dates: ${_.join(
      dates.map(date => moment(date).format('DD/MM/YYYY')),
      ', ',
    )}`,
  );
};

module.exports = cacheProtocolMetrics;
