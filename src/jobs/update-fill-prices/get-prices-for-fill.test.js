const BigNumber = require('bignumber.js');

const getPricesForFill = require('./get-prices-for-fill');

const tokens = {
  '0x4689a4e169eb39cc9078c0940e21ff1aa8a39b9c': {
    decimals: 18,
    name: 'Proton Token',
    symbol: 'PTT',
  },
  '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': {
    name: 'Wrapped Ether',
    symbol: 'WETH',
    decimals: 18,
  },
};

const simpleFill = {
  conversions: {
    USD: {
      amount: 19308.3254534594,
    },
  },
  makerAmount: 9.1e24,
  makerToken: '0x4689a4e169eb39cc9078c0940e21ff1aa8a39b9c',
  takerAmount: 40107028070000000000,
  takerToken: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
};

it('should return null when localised amount not set', () => {
  const fill = {
    ...simpleFill,
    conversions: undefined,
  };
  const prices = getPricesForFill(fill, tokens);

  expect(prices).toBeNull();
});

it('should return null when maker token not recognised', () => {
  const fill = {
    ...simpleFill,
    makerToken: '0xc93408',
  };
  const prices = getPricesForFill(fill, tokens);

  expect(prices).toBeNull();
});

it('should return null when taker token not recognised', () => {
  const fill = {
    ...simpleFill,
    takerToken: '0xc0978',
  };
  const prices = getPricesForFill(fill, tokens);

  expect(prices).toBeNull();
});

it('should return prices', () => {
  const prices = getPricesForFill(simpleFill, tokens);

  expect(prices).toEqual({
    maker: {
      token: new BigNumber('0.00000440736572197802'),
      localised: {
        USD: 0.0021217940058746595,
      },
    },
    taker: {
      token: new BigNumber('226892.90226434870321220487'),
      localised: {
        USD: 481.4200000000001,
      },
    },
  });
});
