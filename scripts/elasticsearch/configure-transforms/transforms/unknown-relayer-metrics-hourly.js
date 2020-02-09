module.exports = {
  name: 'unknown_relayer_metrics_hourly',
  config: {
    description: 'Hourly unknown relayer metrics',
    dest: {
      index: 'unknown_relayer_metrics_hourly',
    },
    sync: {
      time: {
        delay: '60s',
        field: 'updatedAt',
      },
    },
    source: {
      index: ['fills'],
      query: {
        bool: {
          must_not: {
            exists: {
              field: 'relayerId',
            },
          },
        },
      },
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
        makerCount: {
          cardinality: {
            field: 'maker.keyword',
          },
        },
        takerCount: {
          cardinality: {
            field: 'taker.keyword',
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
        traderCount: {
          cardinality: {
            field: 'traders.keyword',
          },
        },
      },
    },
  },
};
