const _ = require('lodash');
const AppStats = require('../model/app-stats');
const AttributionEntity = require('../model/attribution-entity');
const elasticsearch = require('../util/elasticsearch');
const getDatesForTimePeriod = require('../util/get-dates-for-time-period');
const getPercentageChange = require('../util/get-percentage-change');
const getPreviousPeriod = require('../util/get-previous-period');

const precomputeAppStatsForPeriod = async (periodInDays, { logger }) => {
  const dates = getDatesForTimePeriod(periodInDays);
  const apps = await AttributionEntity.find();

  const previousPeriod =
    dates === null ? null : getPreviousPeriod(dates.dateFrom, dates.dateTo);

  const basicData = await elasticsearch.getClient().search({
    index: 'app_metrics_daily',
    size: 0,
    body: {
      aggs: {
        apps: {
          terms: {
            field: 'appId',
            size: 100,
          },
          aggs: {
            relayedTrades: {
              sum: {
                field: 'relayedTradeCount',
              },
            },
            relayedVolume: {
              sum: {
                field: 'relayedTradeValue',
              },
            },
            totalTrades: {
              sum: {
                field: 'totalTradeCount',
              },
            },
            totalVolume: {
              sum: {
                field: 'totalTradeValue',
              },
            },
          },
        },
      },
      query:
        dates === null
          ? undefined
          : {
              range: {
                date: {
                  gte: dates.dateFrom,
                  lte: dates.dateTo,
                },
              },
            },
    },
  });

  const appIds = basicData.body.aggregations.apps.buckets.map(b => b.key);

  const [activeTradersData, previousActiveTradersData] = await Promise.all([
    elasticsearch.getClient().search({
      index: 'trader_metrics_daily',
      size: 0,
      body: {
        aggs: {
          apps: {
            terms: {
              field: 'appIds',
              size: 100,
            },
            aggs: {
              activeTraders: {
                cardinality: {
                  field: 'address',
                },
              },
            },
          },
        },
        query: {
          bool: {
            filter: _.compact([
              dates === null
                ? null
                : {
                    range: {
                      date: {
                        gte: dates.dateFrom,
                        lte: dates.dateTo,
                      },
                    },
                  },
              { terms: { appIds } },
            ]),
          },
        },
      },
    }),
    periodInDays === null
      ? null
      : elasticsearch.getClient().search({
          index: 'trader_metrics_daily',
          size: 0,
          body: {
            aggs: {
              apps: {
                terms: {
                  field: 'appIds',
                  size: 100,
                },
                aggs: {
                  activeTraders: {
                    cardinality: {
                      field: 'address',
                    },
                  },
                },
              },
            },
            query: {
              range: {
                date: {
                  gte: previousPeriod.prevDateFrom,
                  lte: previousPeriod.prevDateTo,
                },
              },
            },
          },
        }),
  ]);

  const appStats = basicData.body.aggregations.apps.buckets.map(bucket => {
    const app = apps.find(a => a.id === bucket.key);

    const activeTraders = activeTradersData.body.aggregations.apps.buckets.find(
      b => b.key === bucket.key,
    );

    const previousActiveTraders = _.get(
      previousActiveTradersData,
      'body.aggregations.apps.buckets',
      [],
    ).find(b => b.key === app.id);

    return {
      appId: bucket.key,
      activeTraders: _.get(activeTraders, 'activeTraders.value', 0),
      activeTradersChange: getPercentageChange(
        _.get(previousActiveTraders, 'activeTraders.value', 0),
        _.get(activeTraders, 'activeTraders.value', 0),
      ),
      appName: app.name,
      periodInDays,
      relayedTrades: bucket.relayedTrades.value,
      relayedVolume: bucket.relayedVolume.value,
      totalTrades: bucket.totalTrades.value,
      totalVolume: bucket.totalVolume.value,
    };
  });

  const operations = appStats.map(document => ({
    updateOne: {
      filter: { appId: document.appId, periodInDays: document.periodInDays },
      update: {
        $set: document,
      },
      upsert: true,
    },
  }));

  const periodDescriptor =
    periodInDays === null ? 'all-time' : `${periodInDays}D`;

  if (operations.length > 0) {
    await AppStats.bulkWrite(operations);
    logger.info(
      `precomputed ${periodDescriptor} stats for ${appStats.length} app(s)`,
    );
  } else {
    logger.warn(`no ${periodDescriptor} app trading activity found`);
  }
};

const precomputeAppStats = async (config, options) => {
  await precomputeAppStatsForPeriod(7, options); // 7 day stats
  await precomputeAppStatsForPeriod(30, options); // 30 day stats
  await precomputeAppStatsForPeriod(365, options); // 365 day stats
  await precomputeAppStatsForPeriod(null, options); // All-time stats
};

module.exports = precomputeAppStats;
