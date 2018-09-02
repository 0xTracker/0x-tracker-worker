const BigNumber = require('bignumber.js');

const formatTokenAmount = require('./format-token-amount');

it('should return unformatted amount when token is null', () => {
  const amount = formatTokenAmount(10500, null);

  expect(amount).toBe(10500);
});

it('should return unformatted amount when token does not have decimals', () => {
  const amount = formatTokenAmount(12, { name: 'Random' });

  expect(amount).toBe(12);
});

it('should return formatted amount', () => {
  const amount = formatTokenAmount(22000000000000000000, { decimals: 18 });

  expect(amount).toEqual(new BigNumber(22));
});
