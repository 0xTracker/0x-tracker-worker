const _ = require('lodash');
const moment = require('moment');
const signale = require('signale');

const computeTokenMetrics = require('../metrics/compute-token-metrics');
const getDatesForMetricsJob = require('../metrics/get-dates-for-metrics-job');
const MetricsJobMetadata = require('../model/metrics-job-metadata');
const TokenMetric = require('../model/token-metric');
const withTransaction = require('../util/with-transaction');

const logger = signale.scope('cache token metrics');

const cacheTokenMetrics = async () => {
  const dates = await getDatesForMetricsJob('token');

  if (dates === null) {
    logger.info('no dates to cache metrics for');
    return;
  }

  logger.time('compute metrics');
  const results = await Promise.all(
    dates.map(date => {
      return computeTokenMetrics(date);
    }),
  );
  logger.timeEnd('compute metrics');

  const metrics = _.flatten(results);

  logger.time('persist metrics');
  await withTransaction(async session => {
    await TokenMetric.bulkWrite(
      metrics.map(metric => ({
        updateOne: {
          filter: { date: metric.date, tokenAddress: metric.tokenAddress },
          update: { $set: metric },
          upsert: true,
        },
      })),
      { session },
    );

    await MetricsJobMetadata.bulkWrite(
      dates.map(date => ({
        updateOne: {
          filter: { date, metricType: 'token' },
          update: {
            $set: {
              date,
              metricType: 'token',
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
    `updated token metrics for dates: ${_.join(
      dates.map(date => moment(date).format('DD/MM/YYYY')),
      ', ',
    )}`,
  );
};

module.exports = cacheTokenMetrics;
