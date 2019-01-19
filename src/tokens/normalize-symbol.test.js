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
});
