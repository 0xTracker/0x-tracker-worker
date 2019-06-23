const _ = require('lodash');
const moment = require('moment');

const Fill = require('../model/fill');
const MetricsJobMetadata = require('../model/metrics-job-metadata');

const getFirstFillDate = async () => {
  const firstFill = await Fill.findOne().sort({ date: 1 });

  // If no fills exist then signal callee to bail out
  if (firstFill === null) {
    return null;
  }

  return moment
    .utc(firstFill.date)
    .startOf('day')
    .toDate();
};

const getLastFillDate = async () => {
  const lastFill = await Fill.findOne().sort({ date: -1 });

  if (lastFill === null) {
    return null;
  }

  return moment
    .utc(lastFill.date)
    .startOf('day')
    .toDate();
};

const datePlusDays = (date, numberOfDays) => {
  return [
    date,
    ..._.times(numberOfDays, index =>
      moment
        .utc(date)
        .add(index + 1, 'days')
        .toDate(),
    ),
  ];
};

const getUnboundedDates = async (metricType, lastFillDate) => {
  // Find the last date for which metrics were computed
  const lastComputed = await MetricsJobMetadata.findOne({ metricType }).sort({
    date: -1,
  });

  // If no metrics have been computed then try to backfill the first 10 days
  if (lastComputed === null) {
    const minDate = await getFirstFillDate();

    if (minDate === null) {
      return null;
    }

    // Return ten sequential days to compute metrics for
    return datePlusDays(minDate, 9);
  }

  // If last computed date was before last fill then backfill the next 10 days
  if (lastComputed.date < lastFillDate) {
    const nextDate = moment
      .utc(lastComputed.date)
      .add(1, 'days')
      .toDate();

    return datePlusDays(nextDate, 9);
  }

  const startOfToday = moment
    .utc()
    .startOf('day')
    .toDate();

  // All dates have been computed so fallback to recomputing metrics for today
  // and the 9 most stale dates.
  const mostStale = await MetricsJobMetadata.find({
    date: { $ne: startOfToday },
    metricType,
  })
    .sort({
      lastUpdated: 1,
    })
    .limit(9);

  return [startOfToday, ...mostStale.map(metadata => metadata.date)];
};

const getDatesForMetricsJob = async metricType => {
  const lastFillDate = await getLastFillDate();
  const dates = await getUnboundedDates(metricType, lastFillDate);

  // No fills exist, signal job to bail out
  if (dates === null) {
    return null;
  }

  return dates.filter(date => date <= lastFillDate);
};

module.exports = getDatesForMetricsJob;
