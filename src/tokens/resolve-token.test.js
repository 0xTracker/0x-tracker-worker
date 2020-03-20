const { TOKEN_TYPE } = require('../constants');
const resolveToken = require('./resolve-token');

describe('resolveToken', () => {
  it('should resolve USDC', async () => {
    const token = await resolveToken(
      '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      TOKEN_TYPE.ERC20,
    );

    expect(token).toEqual({
      decimals: 6,
      name: 'USD//C',
      symbol: 'USDC',
    });
  });

  it('should resolve CARD token', async () => {
    const token = await resolveToken(
      '0x0e3a2a1f2146d86a604adc220b4967a898d7fe07',
      TOKEN_TYPE.ERC721,
    );

    expect(token).toEqual({
      decimals: 1,
      name: 'Gods Unchained Cards',
      symbol: 'CARD',
    });
  });

  it('should resolve imBTC token', async () => {
    const token = await resolveToken(
      '0x3212b29e33587a00fb1c83346f5dbfa69a458923',
      TOKEN_TYPE.ERC20,
    );

    expect(token).toEqual({
      decimals: 8,
      name: 'The Tokenized Bitcoin',
      symbol: 'imBTC',
    });
  });

  it('should resolve AMPLw token', async () => {
    const token = await resolveToken(
      '0xb2b9d7ba7b7e5fb4e51a8bac83fd43e90c947dc5',
      TOKEN_TYPE.ERC20,
    );

    expect(token).toEqual({
      decimals: 9,
      name: 'Ampleforth-DeversiFi-Wrapper',
      symbol: 'AMPLw',
    });
  });
});
