module.exports = {
  name: 'taker_metrics_hourly',
  config: {
    description: 'Hourly taker metrics',
    dest: {
      index: 'taker_metrics_hourly',
    },
    sync: {
      time: {
        delay: '60s',
        field: 'updatedAt',
      },
    },
    source: {
      index: ['fills'],
    },
    frequency: '1m',
    pivot: {
      group_by: {
        date: {
          date_histogram: {
            field: 'date',
            calendar_interval: '1h',
          },
        },
        taker: {
          terms: {
            field: 'taker.keyword',
          },
        },
      },
      aggregations: {
        fillCount: {
          value_count: {
            field: '_id',
          },
        },
        fillVolume: {
          sum: {
            field: 'value',
          },
        },
        tradeCount: {
          sum: {
            field: 'tradeCountContribution',
          },
        },
        tradeVolume: {
          sum: {
            field: 'tradeVolume',
          },
        },
      },
    },
  },
};
