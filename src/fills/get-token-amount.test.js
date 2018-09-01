const BigNumber = require('bignumber.js');

const getTokenAmount = require('./get-token-amount');

const fill = {
  makerAmount: 500,
  makerToken: '0x345',
  takerAmount: 22,
  takerToken: '0x687',
};

it('should return null when token does not match maker or taker', () => {
  const token = {
    address: '0x123',
  };
  const amount = getTokenAmount(token, fill);

  expect(amount).toBeNull();
});

it('should return taker amount when token matches taker', () => {
  const token = {
    address: '0x687',
  };
  const amount = getTokenAmount(token, fill);

  expect(amount).toEqual(new BigNumber(22));
});

it('should return maker amount when token matches maker', () => {
  const token = {
    address: '0x345',
  };
  const amount = getTokenAmount(token, fill);

  expect(amount).toEqual(new BigNumber(500));
});
