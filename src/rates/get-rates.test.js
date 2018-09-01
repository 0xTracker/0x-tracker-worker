const cache = require('memory-cache');
const moment = require('moment');

const { getPrice } = require('../util/crypto-compare');
const getRates = require('./get-rates');

jest.mock('../util/crypto-compare', () => ({
  getPrice: jest.fn(fromSymbol => ({ [fromSymbol]: { USD: 45.6 } })),
}));

beforeEach(() => {
  cache.clear();
  jest.clearAllMocks();
});

it('gets rates for ZRX from Crypto Compare', async () => {
  const date = moment('2017-10-21 15:42');

  const rates = await getRates('ZRX', date);

  expect(rates).toEqual({ ZRX: { USD: 45.6 } });
  expect(getPrice).toHaveBeenCalledWith('ZRX', expect.anything());
});

it('gets rates for ETH from Crypto Compare', async () => {
  const date = moment('2017-10-21 15:42');

  const rates = await getRates('ETH', date);

  expect(rates).toEqual({ ETH: { USD: 45.6 } });
  expect(getPrice).toHaveBeenCalledWith('ETH', expect.anything());
});

it('gets rates for the nearest minute when less than a week ago', async () => {
  const date = moment()
    .second(25)
    .toDate();

  await getRates('ZRX', date);

  expect(getPrice).toHaveBeenCalledWith(
    expect.anything(),
    moment()
      .second(0)
      .millisecond(0)
      .toDate(),
  );
});

it('gets rates from cache when date is in the same 1 minute interval as the last call', async () => {
  const date = moment().second(25);

  await getRates('ZRX', date.toDate());
  await getRates('ZRX', date.add(12, 'seconds').toDate());

  expect(getPrice).toHaveBeenCalledTimes(1);
});

it('gets rates from API when date is in different 1 minute interval as the last call', async () => {
  const date = moment().second(25);

  await getRates('ZRX', date.toDate());
  await getRates('ZRX', date.add(40, 'seconds').toDate());

  expect(getPrice).toHaveBeenCalledTimes(2);
});

it('gets rates for the nearest hour when more than a week ago', async () => {
  const date = new Date('2017-10-21 15:42');

  await getRates('ZRX', date);

  expect(getPrice).toHaveBeenCalledWith(
    expect.anything(),
    new Date('2017-10-21 15:00'),
  );
});

it('gets rates from cache when date is in the same 1 hour interval as last call', async () => {
  const date = moment('2017-10-21 15:42');

  await getRates('ZRX', date);
  await getRates('ZRX', date.add(17, 'minutes').toDate());

  expect(getPrice).toHaveBeenCalledTimes(1);
});

it('gets rates from api when date is in a different 1 hour interval to last call', async () => {
  const date = moment('2017-10-21 15:42');

  await getRates('ZRX', date);

  expect(getPrice).toHaveBeenCalledTimes(1);

  await getRates('ZRX', date.add(18, 'minutes').toDate());

  expect(getPrice).toHaveBeenCalledTimes(2);
});
