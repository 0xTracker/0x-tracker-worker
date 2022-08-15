const _ = require('lodash');
const moment = require('moment');
const elasticsearch = require('../util/elasticsearch');
const getCheckpoint = require('../aggregation/get-checkpoint');
const getIndexName = require('../index/get-index-name');
const saveCheckpoint = require('../aggregation/save-checkpoint');

const BATCH_SIZE = 1000;
const CHECKPOINT_ID = 'protocol_metrics_daily';

const aggregateDailyProtocolMetrics = async ({ enabled }, { logger }) => {
  if (!enabled) {
    logger.warn(`aggregate daily protocol metrics job disabled`);
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
      index: 'fills',
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
      protocolVersion: x.key.protocolVersion,
      tradeCount: x.tradeCount.value,
      tradeVolume: x.tradeVolume.value,
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
              _id: `${dataPoint.date.valueOf()}_${dataPoint.protocolVersion}`,
            },
          }),
          JSON.stringify({
            doc: {
              date: dataPoint.date.toISOString(),
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

module.exports = aggregateDailyProtocolMetrics;
