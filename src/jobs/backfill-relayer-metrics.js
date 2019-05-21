const moment = require('moment');
const mongoose = require('mongoose');
const signale = require('signale');

const computeRelayerMetrics = require('../metrics/compute-relayer-metrics');
const Fill = require('../model/fill');
const MetricsJobMetadata = require('../model/metrics-job-metadata');
const RelayerMetric = require('../model/relayer-metric');

const logger = signale.scope('backfill relayer metrics');

const getNextDateForBackfill = async metricType => {
  const lastCreated = await MetricsJobMetadata.findOne({ metricType }).sort({
    date: -1,
  });

  if (lastCreated === null) {
    const firstFill = await Fill.findOne().sort({ date: 1 });

    if (firstFill === null) {
      return null;
    }

    return moment
      .utc(firstFill.date)
      .startOf('day')
      .toDate();
  }

  return moment
    .utc(lastCreated.date)
    .add(1, 'days')
    .startOf('day')
    .toDate();
};

const updateMetricsJobMetadata = async (
  metricType,
  date,
  { lastUpdated, timeTaken },
  session,
) => {
  await MetricsJobMetadata.updateOne(
    { date, metricType },
    {
      $set: {
        date,
        metricType,
        lastUpdated,
        timeTaken,
      },
    },
    { session, upsert: true },
  );
};

const backfillRelayerMetrics = async () => {
  const nextDate = await getNextDateForBackfill('relayer');

  if (nextDate === null) {
    logger.warn('next date for backfill not available');
    return;
  }

  if (nextDate > Date.now()) {
    logger.info('metrics are up to date');
    return;
  }

  const startDate = Date.now();
  const metrics = await computeRelayerMetrics(nextDate);
  const timeTaken = Date.now() - startDate;

  const session = await mongoose.startSession();

  session.startTransaction();

  try {
    await RelayerMetric.create(metrics, { session });
    await updateMetricsJobMetadata(
      'relayer',
      nextDate,
      {
        lastUpdated: Date.now(),
        timeTaken,
      },
      session,
    );
    await session.commitTransaction();
  } catch (error) {
    logger.error('transaction failed, rolling back');
    await session.abortTransaction();

    throw error;
  }

  session.endSession();

  logger.success(
    `backfilled relayer metrics for ${moment.utc(nextDate).toISOString()}`,
  );
};

module.exports = backfillRelayerMetrics;
