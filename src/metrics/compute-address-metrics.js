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
        addresses: [
          { type: 'maker', value: '$maker' },
          { type: 'taker', value: '$taker' },
        ],
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
        address: '$addresses.value',
        fillCount: {
          maker: {
            $cond: {
              if: { $eq: ['$addresses.type', 'maker'] },
              then: { $literal: 1 },
              else: { $literal: 0 },
            },
          },
          taker: {
            $cond: {
              if: { $eq: ['$addresses.type', 'taker'] },
              then: { $literal: 1 },
              else: { $literal: 0 },
            },
          },
          total: { $literal: 1 },
        },
        fillVolume: {
          maker: {
            $cond: {
              if: { $eq: ['$addresses.type', 'maker'] },
              then: '$conversions.USD.amount',
              else: { $literal: 0 },
            },
          },
          taker: {
            $cond: {
              if: { $eq: ['$addresses.type', 'taker'] },
              then: '$conversions.USD.amount',
              else: { $literal: 0 },
            },
          },
          total: '$conversions.USD.amount',
        },
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
        fillCount: 1,
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
        fillCountMaker: {
          $sum: '$fillCount.maker',
        },
        fillCountTaker: {
          $sum: '$fillCount.taker',
        },
        fillCountTotal: {
          $sum: '$fillCount.total',
        },
        fillVolumeMaker: {
          $sum: '$fillVolume.maker',
        },
        fillVolumeTaker: {
          $sum: '$fillVolume.taker',
        },
        fillVolumeTotal: {
          $sum: '$fillVolume.total',
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
        minutes: {
          $addToSet: {
            date: '$_id.dateToMinute',
            fillCount: '$fillCount',
            fillVolume: '$fillVolume',
          },
        },
        fillCountMaker: {
          $sum: '$fillCountMaker',
        },
        fillCountTaker: {
          $sum: '$fillCountTaker',
        },
        fillCountTotal: {
          $sum: '$fillCountTotal',
        },
        fillVolumeMaker: {
          $sum: '$fillVolumeMaker',
        },
        fillVolumeTaker: {
          $sum: '$fillVolumeTaker',
        },
        fillVolumeTotal: {
          $sum: '$fillVolumeTotal',
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
        hours: {
          $addToSet: {
            date: '$_id.dateToHour',
            fillCount: '$fillCount',
            minutes: '$minutes',
            fillVolume: '$fillVolume',
          },
        },
        fillCountMaker: {
          $sum: '$fillCountMaker',
        },
        fillCountTaker: {
          $sum: '$fillCountTaker',
        },
        fillCountTotal: {
          $sum: '$fillCountTotal',
        },
        fillVolumeMaker: {
          $sum: '$fillVolumeMaker',
        },
        fillVolumeTaker: {
          $sum: '$fillVolumeTaker',
        },
        fillVolumeTotal: {
          $sum: '$fillVolumeTotal',
        },
      },
    },

    // Project the final shape
    {
      $project: {
        _id: 0,
        address: '$_id.address',
        date: '$_id.dateToDay',
        fillCount: {
          maker: '$fillCountMaker',
          taker: '$fillCountTaker',
          total: '$fillCountTotal',
        },
        fillVolume: {
          maker: '$fillVolumeMaker',
          taker: '$fillVolumeTaker',
          total: '$fillVolumeTotal',
        },
        hours: 1,
      },
    },

    // Pre-sort by most common dimension
    {
      $sort: {
        date: -1,
        'fillVolume.total': -1,
      },
    },
  ]);

  logger.timeEnd(profileLabel);

  return results;
};

module.exports = computeAddressMetrics;
