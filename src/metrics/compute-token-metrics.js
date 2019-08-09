const moment = require('moment');
const signale = require('signale');

const Fill = require('../model/fill');

const logger = signale.scope('compute token metrics');

const computeTokenMetrics = async date => {
  const startOfDay = moment
    .utc(date)
    .startOf('day')
    .toDate();

  const endOfDay = moment
    .utc(date)
    .endOf('day')
    .toDate();

  const profileLabel = `compute metrics for ${moment(date).toISOString()}`;

  logger.time(profileLabel);

  const results = await Fill.aggregate([
    // Match only fills from the specified day
    {
      $match: {
        date: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      },
    },

    // Expand the assets field ready for aggregation
    {
      $unwind: {
        path: '$assets',
      },
    },

    // Extract date parts for reassembly in next step
    {
      $project: {
        dateParts: {
          $dateToParts: {
            date: '$date',
          },
        },
        tokenAddress: '$assets.tokenAddress',
        tokenValue: '$assets.amount',
        usdValue: '$assets.value.USD',
      },
    },

    // Reassemble date parts to required precision
    {
      $project: {
        dateToMinute: {
          $dateFromParts: {
            year: '$dateParts.year',
            month: '$dateParts.month',
            day: '$dateParts.day',
            hour: '$dateParts.hour',
            minute: '$dateParts.minute',
          },
        },
        dateToHour: {
          $dateFromParts: {
            year: '$dateParts.year',
            month: '$dateParts.month',
            day: '$dateParts.day',
            hour: '$dateParts.hour',
          },
        },
        dateToDay: {
          $dateFromParts: {
            year: '$dateParts.year',
            month: '$dateParts.month',
            day: '$dateParts.day',
          },
        },
        tokenAddress: 1,
        tokenValue: 1,
        usdValue: 1,
      },
    },

    // Aggregate metrics by minute
    {
      $group: {
        _id: {
          tokenAddress: '$tokenAddress',
          dateToDay: '$dateToDay',
          dateToHour: '$dateToHour',
          dateToMinute: '$dateToMinute',
        },
        fillCount: {
          $sum: 1,
        },
        tokenVolume: {
          $sum: '$tokenValue',
        },
        usdVolume: {
          $sum: '$usdValue',
        },
      },
    },

    // Aggregate metrics by hour
    {
      $group: {
        _id: {
          tokenAddress: '$_id.tokenAddress',
          dateToDay: '$_id.dateToDay',
          dateToHour: '$_id.dateToHour',
        },
        fillCount: {
          $sum: '$fillCount',
        },
        minutes: {
          $addToSet: {
            date: '$_id.dateToMinute',
            fillCount: '$fillCount',
            tokenVolume: '$tokenVolume',
            usdVolume: '$usdVolume',
          },
        },
        tokenVolume: {
          $sum: '$tokenVolume',
        },
        usdVolume: {
          $sum: '$usdVolume',
        },
      },
    },

    // Aggregate metrics by day
    {
      $group: {
        _id: {
          dateToDay: '$_id.dateToDay',
          tokenAddress: '$_id.tokenAddress',
        },
        fillCount: {
          $sum: '$fillCount',
        },
        hours: {
          $addToSet: {
            date: '$_id.dateToHour',
            fillCount: '$fillCount',
            minutes: '$minutes',
            tokenVolume: '$tokenVolume',
            usdVolume: '$usdVolume',
          },
        },
        tokenVolume: {
          $sum: '$tokenVolume',
        },
        usdVolume: {
          $sum: '$usdVolume',
        },
      },
    },

    // Project final shape for persistence
    {
      $project: {
        date: '$_id.dateToDay',
        fillCount: 1,
        hours: 1,
        _id: 0,
        tokenAddress: '$_id.tokenAddress',
        tokenVolume: 1,
        usdVolume: 1,
      },
    },
  ]);

  logger.timeEnd(profileLabel);

  return results;
};

module.exports = computeTokenMetrics;
