const _ = require('lodash');
const moment = require('moment');

const Fill = require('../model/fill');
const MetricsJobMetadata = require('../model/metrics-job-metadata');

const getMinDate = async () => {
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

const getMaxDate = async () => {
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

const getUnboundedDates = async metricType => {
  // Find the last date for which metrics were computed
  const lastProcessed = await MetricsJobMetadata.findOne({ metricType }).sort({
    date: -1,
  });

  // If no metrics have been computed then try to backfill the first 10 days
  if (lastProcessed === null) {
    const minDate = await getMinDate();

    if (minDate === null) {
      return null;
    }

    // Return ten sequential days to compute metrics for
    return datePlusDays(minDate, 9);
  }

  const startOfToday = moment
    .utc()
    .startOf('day')
    .toDate();

  // If last processed date was before today then backfill the next 10 days
  if (lastProcessed.date < startOfToday) {
    const nextDate = moment
      .utc(lastProcessed.date)
      .add(1, 'days')
      .toDate();

    return datePlusDays(nextDate, 9);
  }

  const lastUpdated = await MetricsJobMetadata.find({
    date: { $ne: startOfToday },
    metricType,
  })
    .sort({
      lastUpdated: 1,
    })
    .limit(9);

  return [startOfToday, ...lastUpdated.map(metadata => metadata.date)];
};

const getDatesForMetricsJob = async () => {
  const dates = await getUnboundedDates();

  // No fills exist, signal job to bail out
  if (dates === null) {
    return null;
  }

  const maxDate = await getMaxDate();

  return dates.filter(date => date <= maxDate);
};

module.exports = getDatesForMetricsJob;
