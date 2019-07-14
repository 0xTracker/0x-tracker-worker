const moment = require('moment');

const TokenMetric = require('../model/token-metric');

const computeTokenStatsForDates = async (dateFrom, dateTo) => {
  const dayFrom = moment
    .utc(dateFrom)
    .startOf('day')
    .toDate();
  const dayTo = moment
    .utc(dateTo)
    .endOf('day')
    .toDate();

  const baseQuery = {
    date: {
      $gte: dayFrom,
      $lte: dayTo,
    },
  };

  const results = await TokenMetric.aggregate([
    {
      $match: baseQuery,
    },
    {
      $group: {
        _id: '$tokenAddress',
        fillCount: {
          $sum: '$fillCount',
        },
        tokenVolume: {
          $sum: '$tokenVolume',
        },
        usdVolume: {
          $sum: '$usdVolume',
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

module.exports = computeTokenStatsForDates;
