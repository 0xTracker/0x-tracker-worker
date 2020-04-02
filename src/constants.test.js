const { BASE_TOKENS, BASE_TOKEN_DECIMALS } = require('./constants');

describe('constants', () => {
  it('should have a BASE_TOKEN_DECIMALS value for every base token', () => {
    const missing = Object.keys(BASE_TOKENS).some(
      tokenAddress => BASE_TOKEN_DECIMALS[tokenAddress] === undefined,
    );

    expect(missing).toBe(false);
  });
});
