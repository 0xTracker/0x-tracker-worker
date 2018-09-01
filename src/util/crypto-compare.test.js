const moment = require('moment');

const { getPrice } = require('./crypto-compare');

it('should get ETH price for 2018-05-22T15:10Z', async () => {
  const price = await getPrice('ETH', new Date('2018-05-22T15:10Z'));

  expect(price).toEqual({
    ETH: { USD: 678.46 },
  });
});

it('should get ETH price from one hour ago', async () => {
  const price = await getPrice(
    'ETH',
    moment()
      .subtract(1, 'hour')
      .toDate(),
  );

  expect(price).toEqual({
    ETH: { USD: expect.any(Number) },
  });
});
