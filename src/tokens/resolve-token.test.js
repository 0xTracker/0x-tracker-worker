const { TOKEN_TYPE } = require('../constants');
const ethplorer = require('../util/ethplorer');
const getTokenMetadata = require('../util/ethereum/get-token-metadata');
const resolveToken = require('./resolve-token');

jest.mock('../util/ethplorer');
jest.mock('../util/ethereum/get-token-metadata');

describe('resolveToken', () => {
  it('should resolve token when ethplorer has all values', async () => {
    getTokenMetadata.mockResolvedValueOnce(null);
    ethplorer.getTokenInfo.mockResolvedValueOnce({
      circulatingSupply: 5200,
      decimals: 6,
      name: 'USD//C',
      symbol: 'USDC',
      totalSupply: 5600,
    });

    const token = await resolveToken(
      '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      TOKEN_TYPE.ERC20,
    );

    expect(token).toEqual({
      circulatingSupply: 5200,
      decimals: 6,
      name: 'USD//C',
      symbol: 'USDC',
      totalSupply: 5600,
    });
  });

  it('should resolve token when contract has all values', async () => {
    getTokenMetadata.mockResolvedValueOnce({
      decimals: 6,
      name: 'USD Coin',
      symbol: 'USDC',
    });
    ethplorer.getTokenInfo.mockResolvedValueOnce(null);

    const token = await resolveToken(
      '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      TOKEN_TYPE.ERC20,
    );

    expect(token).toEqual({
      circulatingSupply: null,
      decimals: 6,
      name: 'USD Coin',
      symbol: 'USDC',
      totalSupply: null,
    });
  });

  it('should prefer contract metadata over ethplorer info', async () => {
    getTokenMetadata.mockResolvedValueOnce({
      decimals: 8,
      name: 'USD Coin',
      symbol: 'USDC',
    });
    ethplorer.getTokenInfo.mockResolvedValueOnce({
      circulatingSupply: 5200,
      decimals: 6,
      name: 'USD//C',
      symbol: 'USD-C',
      totalSupply: 5600,
    });

    const token = await resolveToken(
      '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      TOKEN_TYPE.ERC20,
    );

    expect(token).toEqual({
      circulatingSupply: 5200,
      decimals: 8,
      name: 'USD Coin',
      symbol: 'USDC',
      totalSupply: 5600,
    });
  });

  it('should return null values when at least one field is set', async () => {
    getTokenMetadata.mockResolvedValueOnce(null);
    ethplorer.getTokenInfo.mockResolvedValueOnce({
      decimals: 6,
    });

    const token = await resolveToken(
      '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      TOKEN_TYPE.ERC20,
    );

    expect(token).toEqual({
      circulatingSupply: null,
      decimals: 6,
      name: null,
      symbol: null,
      totalSupply: null,
    });
  });

  it('should return null when metadata not available', async () => {
    getTokenMetadata.mockResolvedValueOnce({});
    ethplorer.getTokenInfo.mockResolvedValueOnce({});

    const token = await resolveToken(
      '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      TOKEN_TYPE.ERC20,
    );

    expect(token).toBeNull();
  });

  it('should return null when token metadata cannot be found', async () => {
    getTokenMetadata.mockResolvedValueOnce(null);
    ethplorer.getTokenInfo.mockResolvedValueOnce(null);

    const token = await resolveToken(
      '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      TOKEN_TYPE.ERC20,
    );

    expect(token).toBeNull();
  });

  it('should return decimals = 1 when token type is ERC-721', async () => {
    getTokenMetadata.mockResolvedValueOnce(null);
    ethplorer.getTokenInfo.mockResolvedValueOnce(null);

    const token = await resolveToken(
      '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      TOKEN_TYPE.ERC721,
    );

    expect(token).toEqual({
      circulatingSupply: null,
      decimals: 1,
      name: null,
      symbol: null,
      totalSupply: null,
    });
  });
});
