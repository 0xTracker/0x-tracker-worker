const _ = require('lodash');
const moment = require('moment');
const elasticsearch = require('../util/elasticsearch');
const getIndexName = require('../index/get-index-name');
const model = require('../model');

const BATCH_SIZE = 1000;
const CHECKPOINT_ID = 'token_metrics_daily';

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
    index: 'traded_tokens',
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
            field: 'tokenAddress',
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

const aggregateDailyTokenMetrics = async ({ enabled }, { logger }) => {
  if (!enabled) {
    logger.warn(`aggregate daily token metrics job disabled`);
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
      } token(s) from ${filters.dateFrom.toISOString()} to now`,
    );
  } else {
    logger.info(
      `aggregating metrics for all tokens from ${filters.dateFrom.toISOString()} to now`,
    );
  }

  const aggregateBatch = async () => {
    const aggregationResponse = await elasticsearch.getClient().search({
      index: 'traded_tokens',
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
                      field: 'tokenAddress',
                    },
                  },
                },
              ],
            },
            aggs: {
              avgPrice: {
                avg: {
                  field: 'priceUSD',
                },
              },
              minPrice: {
                min: {
                  field: 'priceUSD',
                },
              },
              maxPrice: {
                max: {
                  field: 'priceUSD',
                },
              },
              tradeCount: {
                sum: {
                  field: 'tradeCountContribution',
                },
              },
              tradeVolume: {
                sum: {
                  field: 'tradedAmount',
                },
              },
              tradeVolumeUsd: {
                sum: {
                  field: 'tradedAmountUSD',
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
                ? { terms: { tokenAddress: filters.addresses } }
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
      avgPrice: x.avgPrice.value,
      minPrice: x.minPrice.value,
      maxPrice: x.maxPrice.value,
      tradeCount: x.tradeCount.value,
      tradeVolume: x.tradeVolume.value,
      tradeVolumeUsd: x.tradeVolumeUsd.value,
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
              date: dataPoint.date.toISOString(),
              lastUpdated: new Date().toISOString(),
              avgPrice: dataPoint.avgPrice,
              minPrice: dataPoint.minPrice,
              maxPrice: dataPoint.maxPrice,
              tradeCount: dataPoint.tradeCount,
              tradeVolume: dataPoint.tradeVolume,
              tradeVolumeUsd: dataPoint.tradeVolumeUsd,
            },
            doc_as_upsert: true,
          }),
        ].join('\n');
      })
      .join('\n');

    const indexResponse = await elasticsearch.getClient().bulk({
      body: `${body}\n`,
      index: getIndexName('token_metrics_daily'),
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

module.exports = aggregateDailyTokenMetrics;
