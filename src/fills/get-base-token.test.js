const getBaseToken = require('./get-base-token');
const tokenCache = require('../tokens/token-cache');

const tokens = {
  '0x123': { decimals: 18, symbol: 'ZRX' },
  '0x2956356cd2a2bf3202f771f50d3d14a367b48070': {
    address: '0x2956356cd2a2bf3202f771f50d3d14a367b48070',
    decimals: 18,
    symbol: 'WETH',
  },
  '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359': {
    address: '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359',
    decimals: 18,
    symbol: 'DAI',
  },
  '0x7866': { decimals: 18, symbol: 'OMG' },
};

beforeAll(() => {
  tokenCache.initialise(tokens);
});

it('should return WETH in WETH/OMG pair', () => {
  const fill = {
    assets: [
      { tokenAddress: '0x7866' },
      { tokenAddress: '0x2956356cd2a2bf3202f771f50d3d14a367b48070' },
    ],
  };

  const token = getBaseToken(fill, tokens);

  expect(token).toEqual({
    address: '0x2956356cd2a2bf3202f771f50d3d14a367b48070',
    decimals: 18,
    symbol: 'WETH',
  });
});

it('should return DAI in WETH/DAI pair', () => {
  const fill = {
    assets: [
      { tokenAddress: '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359' },
      { tokenAddress: '0x2956356cd2a2bf3202f771f50d3d14a367b48070' },
    ],
  };

  const token = getBaseToken(fill, tokens);

  expect(token).toEqual({
    address: '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359',
    decimals: 18,
    symbol: 'DAI',
  });
});

it('should return DAI in DAI/OMG pair', () => {
  const fill = {
    assets: [
      { tokenAddress: '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359' },
      { tokenAddress: '0x7866' },
    ],
  };

  const token = getBaseToken(fill, tokens);

  expect(token).toEqual({
    address: '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359',
    decimals: 18,
    symbol: 'DAI',
  });
});

it('should return null in ZRX/OMG pair', () => {
  const fill = {
    assets: [{ tokenAddress: '0x123' }, { tokenAddress: '0x7866' }],
  };

  const token = getBaseToken(fill, tokens);

  expect(token).toBeNull();
});

it('should return null when maker token unrecognised', () => {
  const fill = {
    assets: [{ tokenAddress: '0x982374897' }, { tokenAddress: '0x7866' }],
  };

  const token = getBaseToken(fill, tokens);

  expect(token).toBeNull();
});

it('should return null when taker token unrecognised', () => {
  const fill = {
    assets: [{ tokenAddress: '0x123' }, { tokenAddress: '0x8937498723' }],
  };

  const token = getBaseToken(fill, tokens);

  expect(token).toBeNull();
});
