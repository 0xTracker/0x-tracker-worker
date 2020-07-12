const getBaseTokenSymbol = require('./get-base-token-symbol');

describe('tokens/get-base-token-symbol', () => {
  it('should throw an error for non-base token', () => {
    expect(() => {
      getBaseTokenSymbol('0x0d8775f648430679a709e98d2b0cb6250d2887ef');
    }).toThrow(
      new Error(
        'Token is not a base token: 0x0d8775f648430679a709e98d2b0cb6250d2887ef',
      ),
    );
  });

  it('should return DAI for 0x2da4f4ff3eb51bff53b66f00054d6cf8d028349f', () => {
    const symbol = getBaseTokenSymbol(
      '0x2da4f4ff3eb51bff53b66f00054d6cf8d028349f',
    );

    expect(symbol).toBe('DAI');
  });

  it('should return USDC for 0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', () => {
    const symbol = getBaseTokenSymbol(
      '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    );

    expect(symbol).toBe('USDC');
  });
});
