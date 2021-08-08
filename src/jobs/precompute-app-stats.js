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
    index: 'app_fills',
    size: 0,
    body: {
      aggs: {
        apps: {
          terms: {
            field: 'appId',
            size: 100, // In future this may need to increased or be paginated
          },
          aggs: {
            traderCount: {
              cardinality: {
                field: 'traders',
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

  const previousActiveTradersData =
    periodInDays === null || appIds.length === 0
      ? null
      : await elasticsearch.getClient().search({
          index: 'app_fills',
          size: 0,
          body: {
            aggs: {
              apps: {
                terms: {
                  field: 'appId',
                  size: appIds.length,
                },
                aggs: {
                  activeTraders: {
                    cardinality: {
                      field: 'traders',
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
        });

  const appStats = basicData.body.aggregations.apps.buckets.map(bucket => {
    const app = apps.find(a => a.id === bucket.key);

    const previousActiveTraders = _.get(
      previousActiveTradersData,
      'body.aggregations.apps.buckets',
      [],
    ).find(b => b.key === app.id);

    return {
      appId: bucket.key,
      activeTraders: bucket.traderCount.value,
      activeTradersChange: getPercentageChange(
        _.get(previousActiveTraders, 'activeTraders.value', 0),
        bucket.traderCount.value,
      ),
      appName: app.name,
      period: periodInDays === null ? 'all-time' : `${periodInDays}d`,
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
  await precomputeAppStatsForPeriod(1, options); // 24 hour stats
  await precomputeAppStatsForPeriod(7, options); // 7 day stats
  await precomputeAppStatsForPeriod(30, options); // 30 day stats
  await precomputeAppStatsForPeriod(365, options); // 365 day stats
  await precomputeAppStatsForPeriod(null, options); // All-time stats
};

module.exports = precomputeAppStats;
