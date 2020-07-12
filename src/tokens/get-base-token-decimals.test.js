const getBaseTokenDecimals = require('./get-base-token-decimals');

describe('tokens/get-base-token-symbol', () => {
  it('should throw an error for non-base token', () => {
    expect(() => {
      getBaseTokenDecimals('0x0d8775f648430679a709e98d2b0cb6250d2887ef');
    }).toThrow(
      new Error(
        'Token is not a base token: 0x0d8775f648430679a709e98d2b0cb6250d2887ef',
      ),
    );
  });

  it('should return 18 for 0x2da4f4ff3eb51bff53b66f00054d6cf8d028349f', () => {
    const symbol = getBaseTokenDecimals(
      '0x2da4f4ff3eb51bff53b66f00054d6cf8d028349f',
    );

    expect(symbol).toBe(18);
  });

  it('should return 6 for 0xdac17f958d2ee523a2206206994597c13d831ec7', () => {
    const symbol = getBaseTokenDecimals(
      '0xdac17f958d2ee523a2206206994597c13d831ec7',
    );

    expect(symbol).toBe(6);
  });
});
