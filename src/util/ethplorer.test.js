const axios = require('axios');
const ethplorer = require('./ethplorer');

beforeAll(() => {
  ethplorer.configure({ apiKey: 'test-key' });
});

const simpleResponse = {
  name: 'USD//C',
  decimals: '6',
  symbol: 'USDC',
  totalSupply: '710801617360000',
  price: {
    availableSupply: 705793954.364511,
  },
};

describe('ethplorer.getTokenInfo', () => {
  /* Full response test */

  it('should fetch info for recognised token with all fields set', async () => {
    axios.get = jest.fn().mockResolvedValueOnce({
      data: simpleResponse,
    });

    const tokenInfo = await ethplorer.getTokenInfo(
      '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    );

    expect(tokenInfo).toEqual({
      address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      circulatingSupply: 705793954.364511,
      decimals: 6,
      name: 'USD//C',
      symbol: 'USDC',
      totalSupply: 710801617.36,
    });
  });

  /* Decimals tests */

  it('should fetch info for token with null decimals', async () => {
    axios.get = jest.fn().mockResolvedValueOnce({
      data: {
        ...simpleResponse,
        decimals: null,
      },
    });

    const tokenInfo = await ethplorer.getTokenInfo(
      '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    );

    expect(tokenInfo.decimals).toBeUndefined();
  });

  it('should fetch info for token with decimals missing', async () => {
    axios.get = jest.fn().mockResolvedValueOnce({
      data: {
        ...simpleResponse,
        decimals: undefined,
      },
    });

    const tokenInfo = await ethplorer.getTokenInfo(
      '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    );

    expect(tokenInfo.decimals).toBeUndefined();
  });

  it('should fetch info for token with numeric decimals', async () => {
    axios.get = jest.fn().mockResolvedValueOnce({
      data: {
        ...simpleResponse,
        decimals: 6,
      },
    });

    const tokenInfo = await ethplorer.getTokenInfo(
      '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    );

    expect(tokenInfo.decimals).toBe(6);
  });

  /* Circulating supply tests */

  it('should fetch info for token with string available supply', async () => {
    axios.get = jest.fn().mockResolvedValueOnce({
      data: {
        ...simpleResponse,
        price: {
          availableSupply: '705793954.364511',
        },
      },
    });

    const tokenInfo = await ethplorer.getTokenInfo(
      '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    );

    expect(tokenInfo.circulatingSupply).toBe(705793954.364511);
  });

  it('should fetch info for token with null available supply', async () => {
    axios.get = jest.fn().mockResolvedValueOnce({
      data: {
        ...simpleResponse,
        price: {
          availableSupply: null,
        },
      },
    });

    const tokenInfo = await ethplorer.getTokenInfo(
      '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    );

    expect(tokenInfo.circulatingSupply).toBeUndefined();
  });

  it('should fetch info for token with available supply missing', async () => {
    axios.get = jest.fn().mockResolvedValueOnce({
      data: {
        ...simpleResponse,
        price: {
          availableSupply: undefined,
        },
      },
    });

    const tokenInfo = await ethplorer.getTokenInfo(
      '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    );

    expect(tokenInfo.circulatingSupply).toBeUndefined();
  });

  it('should fetch info for token with price missing', async () => {
    axios.get = jest.fn().mockResolvedValueOnce({
      data: {
        ...simpleResponse,
        price: undefined,
      },
    });

    const tokenInfo = await ethplorer.getTokenInfo(
      '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    );

    expect(tokenInfo.circulatingSupply).toBeUndefined();
  });

  /* Name and symbol tests */

  it('should fetch info for token with empty name and symbol', async () => {
    axios.get = jest.fn().mockResolvedValueOnce({
      data: {
        ...simpleResponse,
        name: '',
        symbol: '',
      },
    });

    const tokenInfo = await ethplorer.getTokenInfo(
      '0xeb269732ab75a6fd61ea60b06fe994cd32a83549',
    );

    expect(tokenInfo.name).toBeUndefined();
    expect(tokenInfo.symbol).toBeUndefined();
  });

  it('should fetch info for token with null name and symbol', async () => {
    axios.get = jest.fn().mockResolvedValueOnce({
      data: {
        ...simpleResponse,
        name: null,
        symbol: null,
      },
    });

    const tokenInfo = await ethplorer.getTokenInfo(
      '0xeb269732ab75a6fd61ea60b06fe994cd32a83549',
    );

    expect(tokenInfo.name).toBeUndefined();
    expect(tokenInfo.symbol).toBeUndefined();
  });

  it('should fetch info for token with missing name and symbol', async () => {
    axios.get = jest.fn().mockResolvedValueOnce({
      data: {
        ...simpleResponse,
        name: undefined,
        symbol: undefined,
      },
    });

    const tokenInfo = await ethplorer.getTokenInfo(
      '0xeb269732ab75a6fd61ea60b06fe994cd32a83549',
    );

    expect(tokenInfo.name).toBeUndefined();
    expect(tokenInfo.symbol).toBeUndefined();
  });

  /* Total supply tests */

  it('should fetch info for token with total supply missing', async () => {
    axios.get = jest.fn().mockResolvedValueOnce({
      data: {
        ...simpleResponse,
        totalSupply: undefined,
      },
    });

    const tokenInfo = await ethplorer.getTokenInfo(
      '0xeb269732ab75a6fd61ea60b06fe994cd32a83549',
    );

    expect(tokenInfo.totalSupply).toBeUndefined();
  });

  it('should fetch info for token with null total supply', async () => {
    axios.get = jest.fn().mockResolvedValueOnce({
      data: {
        ...simpleResponse,
        totalSupply: null,
      },
    });

    const tokenInfo = await ethplorer.getTokenInfo(
      '0xeb269732ab75a6fd61ea60b06fe994cd32a83549',
    );

    expect(tokenInfo.totalSupply).toBeUndefined();
  });

  it('should fetch info for token with numeric total supply', async () => {
    axios.get = jest.fn().mockResolvedValueOnce({
      data: {
        ...simpleResponse,
        totalSupply: 710801617360000,
      },
    });

    const tokenInfo = await ethplorer.getTokenInfo(
      '0xeb269732ab75a6fd61ea60b06fe994cd32a83549',
    );

    expect(tokenInfo.totalSupply).toBe(710801617.36);
  });

  /* Error tests */

  it('should return null when token address format is invalid', async () => {
    const error = new Error('Network error');

    error.response = {
      data: { error: { code: 104, message: 'Invalid address format' } },
    };

    axios.get = jest.fn().mockRejectedValueOnce(error);

    const tokenInfo = await ethplorer.getTokenInfo('0x9200983');

    expect(tokenInfo).toBeNull();
  });

  it('should return null when token address is not a token contract', async () => {
    const error = new Error('Network error');

    error.response = {
      data: {
        error: { code: 150, message: 'Address is not a token contract' },
      },
    };

    axios.get = jest.fn().mockRejectedValueOnce(error);

    const tokenInfo = await ethplorer.getTokenInfo(
      '0x41f8d14c9475444f30a80431c68cf24dc9a8369a',
    );

    expect(tokenInfo).toBeNull();
  });
});
