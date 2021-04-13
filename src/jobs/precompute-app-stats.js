const _ = require('lodash');
const AppStats = require('../model/app-stats');
const AttributionEntity = require('../model/attribution-entity');
const elasticsearch = require('../util/elasticsearch');
const getDatesForTimePeriod = require('../util/get-dates-for-time-period');
const getPercentageChange = require('../util/get-percentage-change');
const getPreviousPeriod = require('../util/get-previous-period');

const precomputeAppStatsForPeriod = async (periodInDays, { logger }) => {
  const start = Date.now();
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
            size: 100, // In future this may need to increased or be paginated
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

  const [
    activeTradersData,
    previousActiveTradersData,
    previousStatsData,
  ] = await Promise.all([
    appIds.length === 0
      ? null
      : elasticsearch.getClient().search({
          index: 'trader_metrics_daily',
          size: 0,
          body: {
            aggs: {
              apps: {
                terms: {
                  field: 'appIds',
                  size: appIds.length,
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
    periodInDays === null || appIds.length === 0
      ? null
      : elasticsearch.getClient().search({
          index: 'trader_metrics_daily',
          size: 0,
          body: {
            aggs: {
              apps: {
                terms: {
                  field: 'appIds',
                  size: appIds.length,
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
                filter: [
                  {
                    range: {
                      date: {
                        gte: previousPeriod.prevDateFrom,
                        lte: previousPeriod.prevDateTo,
                      },
                    },
                  },
                  { terms: { appIds } },
                ],
              },
            },
          },
        }),
    periodInDays === null || appIds.length === 0
      ? null
      : elasticsearch.getClient().search({
          index: 'app_metrics_daily',
          size: 0,
          body: {
            aggs: {
              apps: {
                terms: {
                  field: 'appId',
                  size: appIds.length,
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
            query: {
              bool: {
                filter: [
                  {
                    range: {
                      date: {
                        gte: previousPeriod.prevDateFrom,
                        lte: previousPeriod.prevDateTo,
                      },
                    },
                  },
                  { terms: { appId: appIds } },
                ],
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

    const previousStats = _.get(
      previousStatsData,
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
      period: periodInDays === null ? 'all-time' : `${periodInDays}d`,
      relayedTrades: bucket.relayedTrades.value,
      relayedTradesChange: getPercentageChange(
        _.get(previousStats, 'relayedTrades.value', 0),
        _.get(bucket, 'relayedTrades.value', 0),
      ),
      relayedVolume: bucket.relayedVolume.value,
      relayedVolumeChange: getPercentageChange(
        _.get(previousStats, 'relayedVolume.value', 0),
        _.get(bucket, 'relayedVolume.value', 0),
      ),
      totalTrades: bucket.totalTrades.value,
      totalTradesChange: getPercentageChange(
        _.get(previousStats, 'totalTrades.value', 0),
        _.get(bucket, 'totalTrades.value', 0),
      ),
      totalVolume: bucket.totalVolume.value,
      totalVolumeChange: getPercentageChange(
        _.get(previousStats, 'totalVolume.value', 0),
        _.get(bucket, 'totalVolume.value', 0),
      ),
    };
  });

  const operations = appStats.map(document => ({
    updateOne: {
      filter: { appId: document.appId, period: document.period },
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

    const timeTaken = Date.now() - start;

    logger.info(
      `precomputed ${periodDescriptor} stats for ${appStats.length} app(s) in ${timeTaken}ms`,
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
