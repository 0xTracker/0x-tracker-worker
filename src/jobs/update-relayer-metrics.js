const _ = require('lodash');
const moment = require('moment');
const signale = require('signale');

const computeRelayerMetrics = require('../metrics/compute-relayer-metrics');
const getDatesForMetricsJob = require('../metrics/get-dates-for-metrics-job');
const RelayerMetric = require('../model/relayer-metric');
const updateMetricsJobMetadata = require('../metrics/update-metrics-job-metadata');
const withTransaction = require('../util/with-transaction');

const logger = signale.scope('update relayer metrics');

/*
  This job is responsible for updating the most stale relayer metrics (based on
  a last updated date), as well as relayer metrics for today. This ensures that
  todays metrics are updated regularly, and any changes from past days 
  (e.g. a newly identified) relayer are also accounted for.

  TODO: Set a cut off date (e.g. more than 30 days) for when previous metrics get updated.
*/
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

  await withTransaction(async session => {
    await Promise.all([
      ...metrics.map(metric => {
        return RelayerMetric.updateOne(
          { date: metric.date, relayerId: metric.relayerId },
          { $set: metric },
          { session, upsert: true },
        );
      }),
      ...metrics.map(metric => {
        return updateMetricsJobMetadata(
          'relayer',
          metric.date,
          {
            lastUpdated: Date.now(),
            timeTaken: null,
          },
          session,
        );
      }),
    ]);
  });

  logger.success(
    `updated relayer metrics for dates: ${_.join(
      dates.map(date => moment(date).format('DD/MM/YYYY')),
      ', ',
    )}`,
  );
};

module.exports = updateRelayerMetrics;
