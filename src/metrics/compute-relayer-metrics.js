const moment = require('moment');
const signale = require('signale');

const { getModel } = require('../model');

const logger = signale.scope('compute relayer metrics');

const computeTraderMetrics = async (dateFrom, dateTo) => {
  const results = await getModel('Fill').aggregate([
    {
      $match: {
        date: {
          $gte: dateFrom,
          $lte: dateTo,
        },
      },
    },
    {
      $project: {
        dateParts: {
          $dateToParts: {
            date: '$date',
          },
        },
        maker: 1,
        taker: 1,
        relayerId: 1,
      },
    },
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
        maker: 1,
        taker: 1,
        relayerId: 1,
      },
    },
    {
      $facet: {
        activeMakers: [
          {
            $group: {
              _id: {
                maker: '$maker',
                relayerId: '$relayerId',
              },
            },
          },
          {
            $group: {
              _id: '$_id.relayerId',
              count: {
                $sum: 1,
              },
            },
          },
          {
            $project: {
              _id: 0,
              relayerId: '$_id',
              count: 1,
            },
          },
        ],
        activeTakers: [
          {
            $group: {
              _id: {
                maker: '$taker',
                relayerId: '$relayerId',
              },
            },
          },
          {
            $group: {
              _id: '$_id.relayerId',
              count: {
                $sum: 1,
              },
            },
          },
          {
            $project: {
              _id: 0,
              relayerId: '$_id',
              count: 1,
            },
          },
        ],
        activeTraders: [
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
          {
            $group: {
              _id: {
                maker: '$addresses',
                relayerId: '$relayerId',
              },
            },
          },
          {
            $group: {
              _id: '$_id.relayerId',
              count: {
                $sum: 1,
              },
            },
          },
          {
            $project: {
              _id: 0,
              relayerId: '$_id',
              count: 1,
            },
          },
        ],
      },
    },
  ]);

  return results[0].activeTraders.map(item => {
    const activeMakers = results[0].activeMakers.find(
      makerItem => makerItem.relayerId === item.relayerId,
    ).count;

    const activeTakers = results[0].activeTakers.find(
      takerItem => takerItem.relayerId === item.relayerId,
    ).count;

    return {
      activeMakers,
      activeTakers,
      activeTraders: item.count,
      relayerId: item.relayerId,
    };
  });
};

const computeRelayerMetrics = async date => {
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

  const results = await getModel('Fill').aggregate([
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
        feesUSD: {
          $add: ['$conversions.USD.makerFee', '$conversions.USD.takerFee'],
        },
        feesZRX: {
          $add: ['$makerFee', '$takerFee'],
        },
        protocolFeeUSD: '$conversions.USD.protocolFee',
        protocolFeeETH: '$protocolFee',
        relayerId: 1,
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
        feesUSD: 1,
        feesZRX: 1,
        protocolFeeUSD: 1,
        protocolFeeETH: 1,
        value: 1,
        relayerId: 1,
      },
    },

    // Group fills by minute and aggregate volume/count
    {
      $group: {
        _id: {
          dateToDay: '$dateToDay',
          dateToHour: '$dateToHour',
          dateToMinute: '$dateToMinute',
          relayerId: '$relayerId',
        },
        feesUSD: {
          $sum: '$feesUSD',
        },
        feesZRX: {
          $sum: '$feesZRX',
        },
        fillCount: {
          $sum: 1,
        },
        fillVolume: {
          $sum: '$value',
        },
        protocolFeesUSD: {
          $sum: '$protocolFeeUSD',
        },
        protocolFeesETH: {
          $sum: '$protocolFeeETH',
        },
      },
    },

    // Join on relayers collection to get access to orderMatcher flag
    {
      $lookup: {
        from: 'relayers',
        localField: '_id.relayerId',
        foreignField: 'lookupId',
        as: 'relayer',
      },
    },

    // Fetch first item from projected relayer array
    // There will only ever be one match
    {
      $project: {
        _id: 1,
        feesUSD: 1,
        feesZRX: 1,
        fillCount: 1,
        fillVolume: 1,
        protocolFeesETH: 1,
        protocolFeesUSD: 1,
        relayer: {
          $arrayElemAt: ['$relayer', 0],
        },
      },
    },

    // Calculate trade count/volume based on order matcher flag
    {
      $project: {
        _id: 1,
        feesUSD: 1,
        feesZRX: 1,
        fillCount: 1,
        fillVolume: 1,
        protocolFeesETH: 1,
        protocolFeesUSD: 1,
        tradeCount: {
          $cond: {
            if: '$relayer.orderMatcher',
            then: {
              $divide: ['$fillCount', 2],
            },
            else: '$fillCount',
          },
        },
        tradeVolume: {
          $cond: {
            if: '$relayer.orderMatcher',
            then: {
              $divide: ['$fillVolume', 2],
            },
            else: '$fillVolume',
          },
        },
      },
    },

    // Aggregate by hour, placing the minutes in a subset
    {
      $group: {
        _id: {
          dateToDay: '$_id.dateToDay',
          dateToHour: '$_id.dateToHour',
          relayerId: '$_id.relayerId',
        },
        feesZRX: {
          $sum: '$feesZRX',
        },
        feesUSD: {
          $sum: '$feesUSD',
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
            fees: {
              USD: '$feesUSD',
              ZRX: '$feesZRX',
            },
            fillCount: '$fillCount',
            fillVolume: '$fillVolume',
            protocolFees: {
              USD: '$protocolFeesUSD',
              ETH: '$protocolFeesETH',
            },
            tradeCount: '$tradeCount',
            tradeVolume: '$tradeVolume',
          },
        },
        protocolFeesUSD: {
          $sum: '$protocolFeesUSD',
        },
        protocolFeesETH: {
          $sum: '$protocolFeesETH',
        },
        tradeCount: {
          $sum: '$tradeCount',
        },
        tradeVolume: {
          $sum: '$tradeVolume',
        },
      },
    },

    // Aggregate by day, placing the hours in a subset
    {
      $group: {
        _id: {
          dateToDay: '$_id.dateToDay',
          relayerId: '$_id.relayerId',
        },
        feesUSD: {
          $sum: '$feesUSD',
        },
        feesZRX: {
          $sum: '$feesZRX',
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
            fees: {
              USD: '$feesUSD',
              ZRX: '$feesZRX',
            },
            fillCount: '$fillCount',
            fillVolume: '$fillVolume',
            minutes: '$minutes',
            protocolFees: {
              USD: '$protocolFeesUSD',
              ETH: '$protocolFeesETH',
            },
            tradeCount: '$tradeCount',
            tradeVolume: '$tradeVolume',
          },
        },
        protocolFeesUSD: {
          $sum: '$protocolFeesUSD',
        },
        protocolFeesETH: {
          $sum: '$protocolFeesETH',
        },
        tradeCount: {
          $sum: '$tradeCount',
        },
        tradeVolume: {
          $sum: '$tradeVolume',
        },
      },
    },

    // Project the final metric shape
    {
      $project: {
        _id: 0,
        date: '$_id.dateToDay',
        fees: {
          USD: '$feesUSD',
          ZRX: '$feesZRX',
        },
        fillCount: 1,
        fillVolume: 1,
        hours: 1,
        protocolFees: {
          USD: '$protocolFeesUSD',
          ETH: '$protocolFeesETH',
        },
        relayerId: '$_id.relayerId',
        tradeCount: 1,
        tradeVolume: 1,
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

  const traderMetrics = await computeTraderMetrics(startOfDay, endOfDay);

  logger.timeEnd(profileLabel);

  if (results.length === 0) {
    return [
      {
        activeMakers: 0,
        activeTakers: 0,
        activeTraders: 0,
        date: startOfDay,
        fees: {
          USD: 0,
          ZRX: 0,
        },
        fillCount: 0,
        fillVolume: 0,
        protocolFees: {
          ETH: 0,
          USD: 0,
        },
        tradeCount: 0,
        tradeVolume: 0,
      },
    ];
  }

  return results.map(result => {
    const tradersMetric = traderMetrics.find(
      metric => metric.relayerId === result.relayerId,
    );

    return {
      ...result,
      ...tradersMetric,
    };
  });
};

module.exports = computeRelayerMetrics;
