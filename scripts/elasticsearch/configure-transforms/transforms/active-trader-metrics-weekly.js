module.exports = {
  name: 'active_trader_metrics_weekly',
  config: {
    description: 'Weekly active trader metrics',
    dest: {
      index: 'active_trader_metrics_weekly',
    },
    sync: {
      time: {
        delay: '60s',
        field: 'date',
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
            calendar_interval: '1w',
          },
        },
      },
      aggregations: {
        activeMakers: {
          cardinality: {
            field: 'maker.keyword',
          },
        },
        activeTakers: {
          cardinality: {
            field: 'taker.keyword',
          },
        },
        activeTraders: {
          cardinality: {
            field: 'traders.keyword',
          },
        },
      },
    },
  },
};
