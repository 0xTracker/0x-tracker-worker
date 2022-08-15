const _ = require('lodash');
const moment = require('moment');
const elasticsearch = require('../util/elasticsearch');
const getIndexName = require('../index/get-index-name');
const getCheckpoint = require('../aggregation/get-checkpoint');
const saveCheckpoint = require('../aggregation/save-checkpoint');

const BATCH_SIZE = 1000;
const CHECKPOINT_ID = 'trader_metrics_daily';

const aggregateDailyTraderMetrics = async ({ enabled }, { logger }) => {
  if (!enabled) {
    logger.warn(`aggregate daily trader metrics job disabled`);
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
      return null;
    }

    const aggregationResponse = await elasticsearch.getClient().search({
      index: 'trader_fills',
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
      return null;
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

    const newCheckpoint = moment
      .utc(lastDate)
      .subtract(48, 'hours')
      .endOf('day')
      .toDate();

    await saveCheckpoint(CHECKPOINT_ID, newCheckpoint);

    if (dataPoints.length < BATCH_SIZE) {
      logger.info('no more data points to process');
      return null;
    }

    return result.after_key;
  };

  let afterKey;
  while (afterKey !== null) {
    // eslint-disable-next-line no-await-in-loop
    afterKey = await aggregateBatch(afterKey);
  }
};

module.exports = aggregateDailyTraderMetrics;
