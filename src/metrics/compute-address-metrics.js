const moment = require('moment');
const signale = require('signale');

const Fill = require('../model/fill');

const logger = signale.scope('compute address metrics');

const computeAddressMetrics = async date => {
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

    // Extract rows for both maker and taker addresses
    {
      $addFields: {
        addresses: ['$maker', '$taker'],
      },
    },
    {
      $unwind: {
        path: '$addresses',
      },
    },

    // Compute dates for required precision
    {
      $project: {
        dateParts: {
          $dateToParts: {
            date: '$date',
          },
        },
        address: '$addresses',
        fillVolume: '$conversions.USD.amount',
      },
    },
    {
      $project: {
        address: 1,
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
        fillVolume: 1,
      },
    },

    // Aggregate per minute
    {
      $group: {
        _id: {
          address: '$address',
          dateToDay: '$dateToDay',
          dateToHour: '$dateToHour',
          dateToMinute: '$dateToMinute',
        },
        fillCount: {
          $sum: 1,
        },
        fillVolume: {
          $sum: '$fillVolume',
        },
      },
    },

    // Aggregate per hour
    {
      $group: {
        _id: {
          address: '$_id.address',
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
            fillVolume: '$fillVolume',
          },
        },
        fillVolume: {
          $sum: '$fillVolume',
        },
      },
    },

    // Aggregate per day
    {
      $group: {
        _id: {
          dateToDay: '$_id.dateToDay',
          address: '$_id.address',
        },
        fillCount: {
          $sum: '$fillCount',
        },
        hours: {
          $addToSet: {
            date: '$_id.dateToHour',
            fillCount: '$fillCount',
            minutes: '$minutes',
            fillVolume: '$fillVolume',
          },
        },
        fillVolume: {
          $sum: '$fillVolume',
        },
      },
    },

    // Project the final shape
    {
      $project: {
        _id: 0,
        address: '$_id.address',
        date: '$_id.dateToDay',
        fillCount: 1,
        fillVolume: 1,
        hours: 1,
      },
    },

    // Pre-sort by most common dimension
    {
      $sort: {
        date: -1,
        fillVolume: -1,
      },
    },
  ]);

  logger.timeEnd(profileLabel);

  return results;
};

module.exports = computeAddressMetrics;
