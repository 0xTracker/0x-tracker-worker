const _ = require('lodash');
const moment = require('moment');
const elasticsearch = require('../util/elasticsearch');
const getCheckpoint = require('../aggregation/get-checkpoint');
const getIndexName = require('../index/get-index-name');
const saveCheckpoint = require('../aggregation/save-checkpoint');

const BATCH_SIZE = 1000;
const CHECKPOINT_ID = 'token_metrics_daily';

const aggregateDailyTokenMetrics = async ({ enabled }, { logger }) => {
  if (!enabled) {
    logger.warn(`aggregate daily token metrics job disabled`);
    return;
  }

  const checkpoint = await getCheckpoint(CHECKPOINT_ID);
  const processAfterDate = checkpoint ? checkpoint.date : null;

  if (checkpoint !== null) {
    logger.info(`last checkpoint was ${checkpoint.date.toISOString()}`);
    logger.info(
      `aggregating metrics for all trades made after ${processAfterDate.toISOString()}`,
    );
  } else {
    logger.info('no checkpoint was found');
    logger.info(`aggregating metrics for all trades`);
  }

  const aggregateBatch = async after => {
    const currentCheckpoint = await getCheckpoint(CHECKPOINT_ID);

    /*
      If the current checkpoint was deleted mid-run then stop any more executions
      so that a full backfill is run on the next job iteration.
    */
    if (currentCheckpoint === null && checkpoint !== null) {
      return;
    }

    const aggregationResponse = await elasticsearch.getClient().search({
      index: 'traded_tokens',
      size: 0,
      body: {
        aggs: {
          by_group: {
            composite: {
              after,
              size: BATCH_SIZE,
              sources: [
                {
                  day: {
                    date_histogram: {
                      field: 'date',
                      calendar_interval: 'day',
                      order: 'asc',
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
              priced: {
                filter: {
                  exists: { field: 'priceUSD' },
                },
                aggs: {
                  lastTrade: {
                    top_hits: {
                      size: 1,
                      sort: {
                        date: {
                          order: 'desc',
                        },
                      },
                      _source: {
                        includes: ['date', 'fillId', 'priceUSD'],
                      },
                    },
                  },
                  firstTrade: {
                    top_hits: {
                      size: 1,
                      sort: {
                        date: {
                          order: 'asc',
                        },
                      },
                      _source: {
                        includes: ['date', 'fillId', 'priceUSD'],
                      },
                    },
                  },
                },
              },
            },
          },
        },
        query:
          processAfterDate === null
            ? undefined
            : {
                range: {
                  date: {
                    gt: processAfterDate.toISOString(),
                  },
                },
              },
      },
    });

    const result = aggregationResponse.body.aggregations.by_group;

    const dataPoints = result.buckets.map(x => ({
      date: new Date(x.key.day),
      address: x.key.address,
      avgPrice: x.avgPrice.value,
      minPrice: x.minPrice.value,
      maxPrice: x.maxPrice.value,
      openPrice: _.get(x, 'priced.firstTrade.hits.hits[0]._source.priceUSD'),
      closePrice: _.get(x, 'priced.lastTrade.hits.hits[0]._source.priceUSD'),
      tradeCount: x.tradeCount.value,
      tradeVolume: x.tradeVolume.value,
      tradeVolumeUsd: x.tradeVolumeUsd.value,
    }));

    if (dataPoints.length === 0) {
      logger.info('no more data points to process');
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
              avgPrice: dataPoint.avgPrice,
              openPrice: dataPoint.openPrice,
              closePrice: dataPoint.closePrice,
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

    const newCheckpoint = moment
      .utc(lastDate)
      .subtract(48, 'hours')
      .endOf('day')
      .toDate();

    await saveCheckpoint(CHECKPOINT_ID, newCheckpoint);

    if (dataPoints.length < BATCH_SIZE) {
      logger.info('no more data points to process');
      return;
    }

    await aggregateBatch(result.after_key);
  };

  await aggregateBatch();
};

module.exports = aggregateDailyTokenMetrics;
