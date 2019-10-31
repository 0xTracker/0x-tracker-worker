const moment = require('moment');
const signale = require('signale');

const Fill = require('../model/fill');

const logger = signale.scope('compute protocol version metrics');

const computeProtocolVersionMetrics = async date => {
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

    // Extract the fill value
    // Extract date parts for reassembly in next step
    {
      $project: {
        dateParts: {
          $dateToParts: {
            date: '$date',
          },
        },
        protocolVersion: 1,
        value: '$conversions.USD.amount',
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
        value: 1,
        protocolVersion: 1,
      },
    },

    // Group fills by minute and aggregate volume/count
    {
      $group: {
        _id: {
          dateToDay: '$dateToDay',
          dateToHour: '$dateToHour',
          dateToMinute: '$dateToMinute',
          protocolVersion: '$protocolVersion',
        },
        fillCount: {
          $sum: 1,
        },
        fillVolume: {
          $sum: '$value',
        },
      },
    },

    // Aggregate by hour, placing the minutes in a subset
    {
      $group: {
        _id: {
          dateToDay: '$_id.dateToDay',
          dateToHour: '$_id.dateToHour',
          protocolVersion: '$_id.protocolVersion',
        },
        fillCount: {
          $sum: '$fillCount',
        },
        fillVolume: {
          $sum: '$fillVolume',
        },
        minutes: {
          $addToSet: {
            date: '$_id.dateToMinute',
            fillCount: '$fillCount',
            fillVolume: '$fillVolume',
          },
        },
      },
    },

    // Aggregate by day, placing the hours in a subset
    {
      $group: {
        _id: {
          dateToDay: '$_id.dateToDay',
          protocolVersion: '$_id.protocolVersion',
        },
        fillCount: {
          $sum: '$fillCount',
        },
        fillVolume: {
          $sum: '$fillVolume',
        },
        hours: {
          $addToSet: {
            date: '$_id.dateToHour',
            fillCount: '$fillCount',
            fillVolume: '$fillVolume',
            minutes: '$minutes',
          },
        },
      },
    },

    // Project the final metric shape
    {
      $project: {
        _id: 0,
        date: '$_id.dateToDay',
        fillCount: 1,
        fillVolume: 1,
        hours: 1,
        protocolVersion: '$_id.protocolVersion',
      },
    },

    // Sort metrics by most common dimensions
    {
      $sort: {
        date: -1,
        fillVolume: -1,
      },
    },
  ]);

  logger.timeEnd(profileLabel);

  if (results.length === 0) {
    return [
      {
        date: startOfDay,
        fillCount: 0,
        fillVolume: 0,
      },
    ];
  }

  return results;
};

module.exports = computeProtocolVersionMetrics;
