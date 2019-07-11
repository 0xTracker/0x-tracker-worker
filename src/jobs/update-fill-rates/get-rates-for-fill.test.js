const getRates = require('../../rates/get-rates');
const getRatesForFill = require('./get-rates-for-fill');

jest.mock('../../rates/get-rates');

it('should get rates for fill with WETH as base token', async () => {
  getRates.mockImplementation(fromSymbol => {
    if (fromSymbol === 'ETH') {
      return Promise.resolve({ ETH: { USD: 520.4 } });
    }

    if (fromSymbol === 'ZRX') {
      return Promise.resolve({ ZRX: { USD: 1.3 } });
    }

    return null;
  });

  const fill = {
    makerToken: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    takerToken: '0x0e0989b1f9b8a38983c2ba8053269ca62ec9b195',
  };

  const rates = await getRatesForFill(fill);

  expect(getRates).toHaveBeenCalledTimes(2);
  expect(rates).toEqual({
    ETH: { USD: 520.4 },
    ZRX: { USD: 1.3 },
  });
});

it('should return null when ETH rates cannot be loaded', async () => {
  getRates.mockImplementation(fromSymbol => {
    if (fromSymbol === 'ZRX') {
      return Promise.resolve({ ZRX: { USD: 1.3 } });
    }

    return null;
  });

  const fill = {
    makerToken: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    takerToken: '0x0e0989b1f9b8a38983c2ba8053269ca62ec9b195',
  };

  const rates = await getRatesForFill(fill);

  expect(rates).toBeNull();
});
