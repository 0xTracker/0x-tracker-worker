const getLocalisedAmount = require('./get-localised-amount');

const tokens = {
  '0x123': { address: '0x123', decimals: 18, symbol: 'ZRX' },
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
  '0x7866': { address: '0x7866', decimals: 18, symbol: 'OMG' },
};

it('should return null when tokens unrecognised', () => {
  const fill = {
    makerAmount: '200',
    makerToken: '0x8907',
    takerAmount: '670000000',
    takerToken: '0x8765',
  };
  const amount = getLocalisedAmount(fill, tokens);

  expect(amount).toBe(null);
});

it('should return null when rates not loaded', () => {
  const fill = {
    makerAmount: '10000000000000000000',
    makerToken: '0x123',
    takerAmount: '51000000000000000000',
    takerToken: '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359',
  };
  const amount = getLocalisedAmount(fill, tokens);

  expect(amount).toBe(null);
});

it('should return localised DAI amount for DAI/ZRX pair', () => {
  const rates = { DAI: { USD: 1.02 }, ZRX: { USD: 0.98 } };
  const fill = {
    makerAmount: '10000000000000000000',
    makerToken: '0x123',
    takerAmount: '51000000000000000000',
    takerToken: '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359',
  };
  const amount = getLocalisedAmount(fill, tokens, rates);

  expect(amount).toBe(52.02);
});

it('should return localised DAI amount for WETH/DAI pair', () => {
  const rates = { DAI: { USD: 1.02 }, ETH: { USD: 475.87 } };
  const fill = {
    makerAmount: '10000000000000000000',
    makerToken: '0x2956356cd2a2bf3202f771f50d3d14a367b48070',
    takerAmount: '50000000000000000000',
    takerToken: '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359',
  };
  const amount = getLocalisedAmount(fill, tokens, rates);

  expect(amount).toBe(51);
});
