const getRelayerPrices = require('./get-relayer-prices');

const fillPrices = [
  {
    fill: {
      id: '123',
      date: new Date('2018-06-05T15:44'),
      makerToken: '0x123',
      relayerId: 1,
      takerToken: '0x456',
    },
    prices: {
      maker: {
        USD: 5,
      },
      taker: {
        USD: 8,
      },
    },
  },
  {
    fill: {
      id: '456',
      date: new Date('2018-06-05T15:48'),
      makerToken: '0x123',
      takerToken: '0x456',
    },
    prices: {
      maker: {
        USD: 5.2,
      },
      taker: {
        USD: 8.7,
      },
    },
  },
  {
    fill: {
      id: '789',
      date: new Date('2018-06-05T15:42'),
      makerToken: '0x123',
      relayerId: 2,
      takerToken: '0x456',
    },
    prices: {
      maker: {
        USD: 5.123,
      },
      taker: {
        USD: 8.76,
      },
    },
  },
  {
    fill: {
      id: '987',
      date: new Date('2018-06-05T15:49'),
      makerToken: '0x123',
      relayerId: 1,
      takerToken: '0x789',
    },
    prices: {
      maker: {
        USD: 5.9,
      },
      taker: {
        USD: 89.5,
      },
    },
  },
];

it('should return latest prices', () => {
  const relayers = [
    {
      lookupId: 1,
    },
    {
      lookupId: 2,
    },
  ];
  const relayerPrices = getRelayerPrices(fillPrices, relayers);

  expect(relayerPrices).toEqual({
    1: {
      '0x123': {
        lastTrade: { id: '987', date: new Date('2018-06-05T15:49') },
        lastPrice: 5.9,
      },
      '0x456': {
        lastTrade: { id: '123', date: new Date('2018-06-05T15:44') },
        lastPrice: 8,
      },
      '0x789': {
        lastTrade: { id: '987', date: new Date('2018-06-05T15:49') },
        lastPrice: 89.5,
      },
    },
    2: {
      '0x123': {
        lastTrade: { id: '789', date: new Date('2018-06-05T15:42') },
        lastPrice: 5.123,
      },
      '0x456': {
        lastTrade: { id: '789', date: new Date('2018-06-05T15:42') },
        lastPrice: 8.76,
      },
    },
  });
});

it('should exclude prices which are older than the previously saved price', () => {
  const relayers = [
    {
      lookupId: 1,
      prices: {
        '0x123': {
          lastTrade: { date: new Date('2018-06-07T15:00') },
          lastPrice: 5.6,
        },
        '0x789': {
          lastTrade: { date: new Date('2018-06-04T15:00') },
          lastPrice: 89,
        },
      },
    },
    {
      lookupId: 2,
      prices: {
        '0x456': {
          lastTrade: { date: new Date('2018-06-07T15:32') },
          lastPrice: 8.7,
        },
      },
    },
  ];
  const relayerPrices = getRelayerPrices(fillPrices, relayers);

  expect(relayerPrices).toEqual({
    1: {
      '0x456': {
        lastTrade: { id: '123', date: new Date('2018-06-05T15:44') },
        lastPrice: 8,
      },
      '0x789': {
        lastTrade: { id: '987', date: new Date('2018-06-05T15:49') },
        lastPrice: 89.5,
      },
    },
    2: {
      '0x123': {
        lastTrade: { id: '789', date: new Date('2018-06-05T15:42') },
        lastPrice: 5.123,
      },
    },
  });
});
