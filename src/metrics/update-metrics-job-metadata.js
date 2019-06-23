const MetricsJobMetadata = require('../model/metrics-job-metadata');

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

module.exports = updateMetricsJobMetadata;
