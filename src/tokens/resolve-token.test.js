const { TOKEN_TYPE } = require('../constants');
const getTokenMetadata = require('../util/ethereum/get-token-metadata');
const resolveToken = require('./resolve-token');

jest.mock('../util/ethereum/get-token-metadata');

describe('resolveToken', () => {
  it('should resolve token when contract has all values', async () => {
    getTokenMetadata.mockResolvedValueOnce({
      decimals: 6,
      name: 'USD Coin',
      symbol: 'USDC',
    });

    const token = await resolveToken(
      '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      TOKEN_TYPE.ERC20,
    );

    expect(token).toEqual({
      decimals: 6,
      name: 'USD Coin',
      symbol: 'USDC',
    });
  });

  it('should return null when metadata not available', async () => {
    getTokenMetadata.mockResolvedValueOnce({});

    const token = await resolveToken(
      '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      TOKEN_TYPE.ERC20,
    );

    expect(token).toBeNull();
  });

  it('should return null when token metadata cannot be found', async () => {
    getTokenMetadata.mockResolvedValueOnce(null);

    const token = await resolveToken(
      '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      TOKEN_TYPE.ERC20,
    );

    expect(token).toBeNull();
  });

  it('should return decimals = 1 when token type is ERC-721', async () => {
    getTokenMetadata.mockResolvedValueOnce(null);

    const token = await resolveToken(
      '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      TOKEN_TYPE.ERC721,
    );

    expect(token).toEqual({
      decimals: 1,
      name: null,
      symbol: null,
    });
  });
});
