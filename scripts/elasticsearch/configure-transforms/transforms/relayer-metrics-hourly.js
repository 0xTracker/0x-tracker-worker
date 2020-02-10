module.exports = {
  name: 'relayer_metrics_hourly',
  config: {
    description: 'Hourly relayer metrics',
    dest: {
      index: 'relayer_metrics_hourly',
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
        relayerId: {
          terms: {
            field: 'relayerId',
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
