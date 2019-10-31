const _ = require('lodash');
const moment = require('moment');
const signale = require('signale');

const computeProtocolVersionMetrics = require('../metrics/compute-protocol-version-metrics');
const getDatesForMetricsJob = require('../metrics/get-dates-for-metrics-job');
const MetricsJobMetadata = require('../model/metrics-job-metadata');
const ProtocolVersionMetric = require('../model/protocol-version-metric');
const withTransaction = require('../util/with-transaction');

const logger = signale.scope('cache protocol version metrics');

const cacheProtocolVersionMetrics = async () => {
  const dates = await getDatesForMetricsJob('protocol-version');

  if (dates === null) {
    logger.info('no metrics available to update');
    return;
  }

  logger.time('compute metrics');
  const results = await Promise.all(
    dates.map(date => {
      return computeProtocolVersionMetrics(date);
    }),
  );
  logger.timeEnd('compute metrics');

  const metrics = _.flatten(results);

  logger.time('persist metrics');
  await withTransaction(async session => {
    if (metrics.length > 0) {
      await ProtocolVersionMetric.bulkWrite(
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
          filter: { date, metricType: 'protocol-version' },
          update: {
            $set: {
              date,
              metricType: 'protocol-version',
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

module.exports = cacheProtocolVersionMetrics;
