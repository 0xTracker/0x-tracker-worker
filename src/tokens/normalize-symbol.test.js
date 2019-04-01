const normalizeSymbol = require('./normalize-symbol');

describe('shared/tokens/normalize-symbol', () => {
  it('returns ETH when symbol is WETH', () => {
    const normalized = normalizeSymbol('WETH');

    expect(normalized).toBe('ETH');
  });

  it('returns ZRX when symbol is ZRX', () => {
    const normalized = normalizeSymbol('ZRX');

    expect(normalized).toBe('ZRX');
  });

  it('returns FUCK when symbol is fuck', () => {
    const normalized = normalizeSymbol('fuck');

    expect(normalized).toBe('FUCK');
  });

  it('returns ETH when symbol is VEIL ETH', () => {
    const normalized = normalizeSymbol('VEIL ETH');

    expect(normalized).toBe('ETH');
  });

  it('returns ETH when symbol is ETHW', () => {
    const normalized = normalizeSymbol('ETHW');

    expect(normalized).toBe('ETH');
  });

  it('returns DAI when symbol is DAIW', () => {
    const normalized = normalizeSymbol('DAIW');

    expect(normalized).toBe('DAI');
  });

  it('returns USDT when symbol is USDTW', () => {
    const normalized = normalizeSymbol('USDTW');

    expect(normalized).toBe('USDT');
  });
});
