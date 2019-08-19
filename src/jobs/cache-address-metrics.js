const _ = require('lodash');
const moment = require('moment');
const signale = require('signale');

const AddressMetric = require('../model/address-metric');
const computeAddressMetrics = require('../metrics/compute-address-metrics');
const getDatesForMetricsJob = require('../metrics/get-dates-for-metrics-job');
const MetricsJobMetadata = require('../model/metrics-job-metadata');
const withTransaction = require('../util/with-transaction');

const logger = signale.scope('cache address metrics');

const cacheAddressMetrics = async () => {
  const dates = await getDatesForMetricsJob('address');

  if (dates === null) {
    logger.info('no metrics available to update');
    return;
  }

  logger.time('compute metrics');
  const results = await Promise.all(
    dates.map(date => {
      return computeAddressMetrics(date);
    }),
  );
  logger.timeEnd('compute metrics');

  const metrics = _.flatten(results);

  logger.time('persist metrics');
  await withTransaction(async session => {
    if (metrics.length > 0) {
      await AddressMetric.bulkWrite(
        metrics.map(metric => ({
          updateOne: {
            filter: { date: metric.date, address: metric.address },
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
          filter: { date, metricType: 'address' },
          update: {
            $set: {
              date,
              metricType: 'address',
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
    `cached address metrics for dates: ${_.join(
      dates.map(date => moment(date).format('DD/MM/YYYY')),
      ', ',
    )}`,
  );
};

module.exports = cacheAddressMetrics;
