const isBaseToken = require('./is-base-token');

describe('tokens/isBaseToken', () => {
  it('should return true for 0xe41d2489571d322189246dafa5ebde1f4699f498', () => {
    expect(isBaseToken('0xe41d2489571d322189246dafa5ebde1f4699f498')).toBe(
      true,
    );
  });

  it('should return true for 0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', () => {
    expect(isBaseToken('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48')).toBe(
      true,
    );
  });

  it('should return true for 0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359', () => {
    expect(isBaseToken('0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359')).toBe(
      true,
    );
  });

  it('should return true for 0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', () => {
    expect(isBaseToken('0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2')).toBe(
      true,
    );
  });

  it('should return false for 0x0d8775f648430679a709e98d2b0cb6250d2887ef', () => {
    expect(isBaseToken('0x0d8775f648430679a709e98d2b0cb6250d2887ef')).toBe(
      false,
    );
  });
});
