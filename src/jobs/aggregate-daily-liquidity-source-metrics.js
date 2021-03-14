const _ = require('lodash');
const moment = require('moment');
const elasticsearch = require('../util/elasticsearch');
const getIndexName = require('../index/get-index-name');
const model = require('../model');

const BATCH_SIZE = 1000;
const CHECKPOINT_ID = 'liquidity_source_metrics_daily';

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
    index: 'fills',
    size: 0,
    body: {
      aggs: {
        earliestDate: {
          min: {
            field: 'date',
          },
        },
        liquiditySourceIds: {
          terms: {
            field: 'liquiditySourceId',
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

  const liquiditySourceIds = aggregationResponse.body.aggregations.liquiditySourceIds.buckets.map(
    x => x.key,
  );

  const earliestDate = aggregationResponse.body.aggregations.earliestDate.value;

  if (earliestDate === null) {
    return null;
  }

  return {
    dateFrom: moment
      .utc(earliestDate)
      .startOf('day')
      .toDate(),
    liquiditySourceIds:
      liquiditySourceIds.length !== MAX_TARGETS
        ? liquiditySourceIds
        : undefined,
  };
};

const aggregateDailyLiquiditySourceMetrics = async (
  { enabled },
  { logger },
) => {
  if (!enabled) {
    logger.warn(`aggregate daily liquidity source metrics job disabled`);
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

  if (filters.liquiditySourceIds) {
    logger.info(
      `aggregating metrics for ${
        filters.liquiditySourceIds.length
      } liquidity source(s) from ${filters.dateFrom.toISOString()} to now`,
    );
  } else {
    logger.info(
      `aggregating metrics for all liquidity sources from ${filters.dateFrom.toISOString()} to now`,
    );
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
                  liquiditySourceId: {
                    terms: {
                      field: 'liquiditySourceId',
                    },
                  },
                },
              ],
            },
            aggs: {
              tradeCount: {
                sum: {
                  field: 'totalTradeCount',
                },
              },
              tradeVolume: {
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
              filters.liquiditySourceIds
                ? { terms: { liquiditySourceId: filters.liquiditySourceIds } }
                : undefined,
            ]),
          },
        },
      },
    });

    const result = aggregationResponse.body.aggregations.by_date;

    const dataPoints = result.buckets.map(x => ({
      date: new Date(x.key.day),
      liquiditySourceId: x.key.liquiditySourceId,
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
              _id: `${dataPoint.date.valueOf()}_${dataPoint.liquiditySourceId}`,
            },
          }),
          JSON.stringify({
            doc: {
              date: dataPoint.date.toISOString(),
              liquiditySourceId: dataPoint.liquiditySourceId,
              lastUpdated: new Date().toISOString(),
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
      index: getIndexName('liquidity_source_metrics_daily'),
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

module.exports = aggregateDailyLiquiditySourceMetrics;
