const moment = require('moment');
const elasticsearch = require('../util/elasticsearch');
const getIndexName = require('../index/get-index-name');
const model = require('../model');

const BATCH_SIZE = 500;
const CHECKPOINT_ID = 'protocol_metrics_daily';

const getCheckpoint = async () => {
  const AggregationCheckpoint = model.getModel('AggregationCheckpoint');
  const currentCheckpoint = await AggregationCheckpoint.findById(CHECKPOINT_ID);

  if (!currentCheckpoint) {
    const initialCheckpoint = await AggregationCheckpoint.create({
      _id: CHECKPOINT_ID,
      date: new Date(),
      previous: null,
      progressData: null,
      complete: false,
    });

    return initialCheckpoint;
  }

  if (currentCheckpoint.complete) {
    currentCheckpoint.set('previous', currentCheckpoint.date);
    currentCheckpoint.set('date', new Date());
    currentCheckpoint.set('progressData', null);
    currentCheckpoint.set('complete', false);

    await currentCheckpoint.save();
  }

  return currentCheckpoint;
};

const determineStartDate = async checkpoint => {
  const aggregationResponse = await elasticsearch.getClient().search({
    index: 'fills',
    size: 0,
    body: {
      aggs: {
        earliestDate: {
          min: {
            field: 'date',
          },
        },
      },
      query: checkpoint.previous
        ? {
            range: {
              updatedAt: {
                gte: checkpoint.previous,
              },
            },
          }
        : undefined,
    },
  });

  const earliestDate = aggregationResponse.body.aggregations.earliestDate.value;

  if (earliestDate === null) {
    return null;
  }

  return moment
    .utc(earliestDate)
    .startOf('day')
    .toDate();
};

const aggregateDailyProtocolMetrics = async (config, { logger }) => {
  const checkpoint = await getCheckpoint();
  const startDate = await determineStartDate(checkpoint);

  if (startDate === null) {
    logger.info('no changes detected since last run');
    checkpoint.set('complete', true);
    checkpoint.set('progressData', null);
    await checkpoint.save();
    return;
  }

  const aggregateBatch = async () => {
    const aggregationResponse = await elasticsearch.getClient().search({
      index: 'fills',
      size: 0,
      body: {
        aggs: {
          by_date: {
            composite: {
              after: checkpoint.progressData || undefined,
              size: BATCH_SIZE,
              sources: [
                {
                  day: {
                    date_histogram: {
                      field: 'date',
                      calendar_interval: 'day',
                    },
                  },
                },
                {
                  protocolVersion: {
                    terms: {
                      field: 'protocolVersion',
                    },
                  },
                },
              ],
            },
            aggs: {
              tradeCount: {
                sum: {
                  field: 'tradeCountContribution',
                },
              },
              tradeVolume: {
                sum: {
                  field: 'tradeVolume',
                },
              },
            },
          },
        },
        query: {
          range: {
            date: {
              gte: startDate.toISOString(),
            },
          },
        },
      },
    });

    const result = aggregationResponse.body.aggregations.by_date;

    const dataPoints = result.buckets.map(x => ({
      date: new Date(x.key.day),
      protocolVersion: x.key.protocolVersion,
      tradeCount: x.tradeCount.value,
      tradeVolume: x.tradeVolume.value,
    }));

    if (dataPoints.length === 0) {
      logger.info('no more data points to process');
      checkpoint.set('complete', true);
      checkpoint.set('progressData', null);
      await checkpoint.save();
      return;
    }

    const body = dataPoints
      .map(dataPoint => {
        return [
          JSON.stringify({
            update: {
              _id: `${dataPoint.date.valueOf()}_${dataPoint.protocolVersion}`,
            },
          }),
          JSON.stringify({
            doc: {
              date: dataPoint.date.toISOString(),
              lastUpdated: new Date().toISOString(),
              protocolVersion: dataPoint.protocolVersion,
              tradeCount: dataPoint.tradeCount,
              tradeVolume: dataPoint.tradeVolume,
            },
            doc_as_upsert: true,
          }),
        ].join('\n');
      })
      .join('\n');

    const indexResponse = await elasticsearch.getClient().bulk({
      body: `${body}\n`,
      index: getIndexName('protocol_metrics_daily'),
    });

    if (indexResponse.body.errors) {
      throw new Error(`Indexing failed`);
    }

    logger.info(`processed ${dataPoints.length} data point(s)`);

    if (dataPoints.length === BATCH_SIZE) {
      checkpoint.set('progressData', result.after_key);
      await checkpoint.save();
    } else {
      logger.info('no more data points to process');
      checkpoint.set('complete', true);
      checkpoint.set('progressData', null);
      await checkpoint.save();
    }
  };

  while (!checkpoint.complete) {
    /* eslint-disable no-await-in-loop */
    await aggregateBatch();
    await new Promise(resolve => {
      setTimeout(resolve, 2000);
    });
    /* eslint-enable no-await-in-loop */
  }
};

module.exports = aggregateDailyProtocolMetrics;
