const AppStats = require('../model/app-stats');
const AttributionEntity = require('../model/attribution-entity');
const elasticsearch = require('../util/elasticsearch');
const getDatesForTimePeriod = require('../util/get-dates-for-time-period');

const precomputeAppStatsForPeriod = async (periodInDays, { logger }) => {
  const dates = getDatesForTimePeriod(periodInDays);
  const apps = await AttributionEntity.find();

  const data = await elasticsearch.getClient().search({
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
                  lte: dates.dateFrom,
                },
              },
            },
    },
  });

  const appStats = data.body.aggregations.apps.buckets.map(bucket => {
    const app = apps.find(a => a.id === bucket.key);

    return {
      appId: bucket.key,
      activeTraders: 0, // TODO
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
