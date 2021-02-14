const _ = require('lodash');
const moment = require('moment');
const elasticsearch = require('../util/elasticsearch');
const getIndexName = require('../index/get-index-name');
const model = require('../model');

const BATCH_SIZE = 1000;
const CHECKPOINT_ID = 'trader_metrics_daily';

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

const getFilters = async checkpoint => {
  const MAX_TARGETS = 100;
  const aggregationResponse = await elasticsearch.getClient().search({
    index: 'trader_fills',
    size: 0,
    body: {
      aggs: {
        earliestDate: {
          min: {
            field: 'date',
          },
        },
        addresses: {
          terms: {
            field: 'address',
            size: MAX_TARGETS,
          },
        },
      },
      query: checkpoint.previous
        ? {
            range: {
              updatedAt: {
                gte: moment
                  .utc(checkpoint.previous)
                  .subtract(10, 'minutes') // Ensure we don't miss fills which have just been indexed but where the index hasn't refreshed
                  .toDate(),
              },
            },
          }
        : undefined,
    },
  });

  const addresses = aggregationResponse.body.aggregations.addresses.buckets.map(
    x => x.key,
  );

  const earliestDate = aggregationResponse.body.aggregations.earliestDate.value;

  if (earliestDate === null) {
    return null;
  }

  return {
    addresses: addresses.length !== MAX_TARGETS ? addresses : undefined,
    dateFrom: moment
      .utc(earliestDate)
      .startOf('day')
      .toDate(),
  };
};

const aggregateDailyTraderMetrics = async ({ enabled }, { logger }) => {
  if (!enabled) {
    logger.warn(`aggregate daily trader metrics job disabled`);
    return;
  }

  const checkpoint = await getCheckpoint();
  const filters = await getFilters(checkpoint);

  if (checkpoint.previous !== null) {
    logger.info(`last checkpoint was ${checkpoint.previous.toISOString()}`);
  } else {
    logger.info('running for the first time');
  }

  if (filters === null) {
    logger.info('no changes detected since last run');
    checkpoint.set('complete', true);
    checkpoint.set('progressData', null);
    await checkpoint.save();
    return;
  }

  if (filters.addresses) {
    logger.info(
      `aggregating metrics for ${
        filters.addresses.length
      } trader(s) from ${filters.dateFrom.toISOString()} to now`,
    );
  } else {
    logger.info(
      `aggregating metrics for all traders from ${filters.dateFrom.toISOString()} to now`,
    );
  }

  const aggregateBatch = async () => {
    const aggregationResponse = await elasticsearch.getClient().search({
      index: 'trader_fills',
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
                  address: {
                    terms: {
                      field: 'address',
                    },
                  },
                },
              ],
            },
            aggs: {
              apps: {
                terms: { field: 'appIds' },
              },
              makerTrades: {
                sum: {
                  field: 'makerTradeCount',
                },
              },
              makerTradeVolume: {
                sum: {
                  field: 'makerTradeValue',
                },
              },
              takerTrades: {
                sum: {
                  field: 'takerTradeCount',
                },
              },
              takerTradeVolume: {
                sum: {
                  field: 'takerTradeValue',
                },
              },
              totalTrades: {
                sum: {
                  field: 'totalTradeCount',
                },
              },
              totalTradeVolume: {
                sum: {
                  field: 'totalTradeValue',
                },
              },
            },
          },
        },
        query: {
          bool: {
            filter: _.compact([
              {
                range: {
                  date: {
                    gte: filters.dateFrom.toISOString(),
                  },
                },
              },
              filters.addresses
                ? { terms: { address: filters.addresses } }
                : undefined,
            ]),
          },
        },
      },
    });

    const result = aggregationResponse.body.aggregations.by_date;

    const dataPoints = result.buckets.map(x => ({
      date: new Date(x.key.day),
      address: x.key.address,
      appIds: x.apps.buckets.map(y => y.key),
      makerTrades: x.makerTrades.value,
      makerTradeVolume: x.makerTradeVolume.value,
      takerTrades: x.takerTrades.value,
      takerTradeVolume: x.takerTradeVolume.value,
      totalTrades: x.totalTrades.value,
      totalTradeVolume: x.totalTradeVolume.value,
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
              _id: `${dataPoint.date.valueOf()}_${dataPoint.address}`,
            },
          }),
          JSON.stringify({
            doc: {
              address: dataPoint.address,
              appIds: dataPoint.appIds,
              date: dataPoint.date.toISOString(),
              lastUpdated: new Date().toISOString(),
              makerTrades: dataPoint.makerTrades,
              makerTradeVolume: dataPoint.makerTradeVolume,
              takerTrades: dataPoint.takerTrades,
              takerTradeVolume: dataPoint.takerTradeVolume,
              totalTrades: dataPoint.totalTrades,
              totalTradeVolume: dataPoint.totalTradeVolume,
            },
            doc_as_upsert: true,
          }),
        ].join('\n');
      })
      .join('\n');

    const indexResponse = await elasticsearch.getClient().bulk({
      body: `${body}\n`,
      index: getIndexName('trader_metrics_daily'),
    });

    if (indexResponse.body.errors) {
      throw new Error(`Indexing failed`);
    }

    const lastDate = _.last(dataPoints).date;

    logger.info(
      `processed ${
        dataPoints.length
      } data point(s) up to ${lastDate.toISOString()}`,
    );

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
    /* eslint-enable no-await-in-loop */
  }
};

module.exports = aggregateDailyTraderMetrics;
