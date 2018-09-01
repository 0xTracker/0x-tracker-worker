const getBaseToken = require('./get-base-token');

const tokens = {
  '0x123': { decimals: 18, symbol: 'ZRX' },
  '0x6789': { decimals: 18, symbol: 'WETH' },
  '0x546389': { decimals: 18, symbol: 'DAI' },
  '0x7866': { decimals: 18, symbol: 'OMG' },
};

it('should return WETH in WETH/OMG pair', () => {
  const fill = {
    makerToken: '0x7866',
    takerToken: '0x6789',
  };

  const amount = getBaseToken(fill, tokens);

  expect(amount).toEqual({ decimals: 18, symbol: 'WETH' });
});

it('should return WETH in WETH/DAI pair', () => {
  const fill = {
    makerToken: '0x546389',
    takerToken: '0x6789',
  };

  const amount = getBaseToken(fill, tokens);

  expect(amount).toEqual({ decimals: 18, symbol: 'WETH' });
});

it('should return DAI in DAI/OMG pair', () => {
  const fill = {
    makerToken: '0x546389',
    takerToken: '0x7866',
  };

  const amount = getBaseToken(fill, tokens);

  expect(amount).toEqual({ decimals: 18, symbol: 'DAI' });
});

it('should return null in ZRX/OMG pair', () => {
  const fill = {
    makerToken: '0x123',
    takerToken: '0x7866',
  };

  const amount = getBaseToken(fill, tokens);

  expect(amount).toBeNull();
});

it('should return null when maker token unrecognised', () => {
  const fill = {
    makerToken: '0x982374897',
    takerToken: '0x7866',
  };

  const amount = getBaseToken(fill, tokens);

  expect(amount).toBeNull();
});

it('should return null when taker token unrecognised', () => {
  const fill = {
    makerToken: '0x123',
    takerToken: '0x8937498723',
  };

  const amount = getBaseToken(fill, tokens);

  expect(amount).toBeNull();
});
