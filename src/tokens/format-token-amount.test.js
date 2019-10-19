const { BigNumber } = require('@0x/utils');

const formatTokenAmount = require('./format-token-amount');

it('should return unformatted amount when token is null', () => {
  const amount = formatTokenAmount(10500, null);

  expect(amount).toBe(10500);
});

it('should return unformatted amount when token does not have decimals', () => {
  const amount = formatTokenAmount(12, { name: 'Random' });

  expect(amount).toBe(12);
});

it('should return formatted amount for token', () => {
  const amount = formatTokenAmount(22000000000000000000, { decimals: 18 });

  expect(amount).toEqual(new BigNumber(22));
});

it('should format tiny amount', () => {
  const amount = formatTokenAmount(1, { decimals: 18 });

  expect(amount).toEqual(new BigNumber(0.000000000000000001));
});

it('should format large amount', () => {
  const amount = formatTokenAmount(100000000000000000000000000, {
    decimals: 18,
  });

  expect(amount).toEqual(new BigNumber(100000000));
});

it('should return formatted amount for decimals', () => {
  const amount = formatTokenAmount(22000000000000000000, 18);

  expect(amount).toEqual(new BigNumber(22));
});
