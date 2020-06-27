const getUniqTokens = require('./get-uniq-tokens');

describe('getUniqTokens', () => {
  it('should return empty array when assets and fees are empty', () => {
    const tokens = getUniqTokens([], []);

    expect(tokens).toEqual(expect.arrayContaining([]));
  });

  it('should return unique token addresses when assets not empty', () => {
    const tokens = getUniqTokens(
      [
        {
          actor: 0,
          amount: 1674924411,
          tokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          tokenType: 0,
        },
        {
          actor: 0,
          amount: 25000000,
          tokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          tokenType: 0,
        },
        {
          actor: 1,
          amount: 7.45216100214005e18,
          tokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
          tokenType: 0,
        },
      ],
      [],
    );

    expect(tokens).toEqual([
      {
        address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        type: 0,
      },
      {
        address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        type: 0,
      },
    ]);
  });
});
