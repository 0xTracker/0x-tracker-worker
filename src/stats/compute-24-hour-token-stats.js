const moment = require('moment');

const TokenMetric = require('../model/token-metric');

const compute24HourTokenStats = async () => {
  const dateFrom = moment
    .utc()
    .subtract(24, 'hours')
    .toDate();

  const baseQuery = {
    date: {
      $gte: moment
        .utc(dateFrom)
        .startOf('day')
        .toDate(),
    },
  };

  const basePipeline = [
    {
      $unwind: {
        path: '$hours',
      },
    },
    {
      $unwind: {
        path: '$hours.minutes',
      },
    },
    {
      $match: {
        'hours.minutes.date': {
          $gte: dateFrom,
        },
      },
    },
  ];

  const results = await TokenMetric.aggregate([
    {
      $match: baseQuery,
    },
    ...basePipeline,
    {
      $group: {
        _id: '$tokenAddress',
        fillCount: {
          $sum: '$hours.minutes.fillCount',
        },
        tokenVolume: {
          $sum: '$hours.minutes.tokenVolume',
        },
        usdVolume: {
          $sum: '$hours.minutes.usdVolume',
        },
      },
    },
  ]);

  return results.map(result => ({
    fillCount: result.fillCount,
    tokenAddress: result._id,
    tokenVolume: result.tokenVolume,
    usdVolume: result.usdVolume,
  }));
};

module.exports = compute24HourTokenStats;
