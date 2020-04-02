const { FILL_ACTOR } = require('../../constants');
const deriveTokenPriceFromFill = require('./derive-token-price-from-fill');

describe('derive token price from fill', () => {
  it('should throw an error when the fill has not been measured', () => {
    const fill = { _id: '5d2ed0a5284b0b440de8a3f7' };

    expect(() => {
      deriveTokenPriceFromFill(fill);
    }).toThrow(/Fill 5d2ed0a5284b0b440de8a3f7 has not been measured/);
  });

  it('should throw an error when fill does not have any unpriced assets', () => {
    const fill = {
      _id: '5d2ed0a5284b0b440de8a3f7',
      assets: [
        { actor: FILL_ACTOR.MAKER, price: { USD: 21.8 } },
        { actor: FILL_ACTOR.TAKER, price: { USD: 48.7 } },
      ],
      conversions: {
        USD: {
          amount: 4000,
        },
      },
    };

    expect(() => {
      deriveTokenPriceFromFill(fill);
    }).toThrow(/Fill has no unpriced assets: 5d2ed0a5284b0b440de8a3f7/);
  });

  it('should throw an error when fill has unpriced assets for both actors', () => {
    const fill = {
      _id: '5d2ed0a5284b0b440de8a3f7',
      assets: [
        { actor: FILL_ACTOR.MAKER, price: { USD: 21.8 } },
        { actor: FILL_ACTOR.MAKER },
        { actor: FILL_ACTOR.TAKER },
      ],
      conversions: {
        USD: {
          amount: 4000,
        },
      },
    };

    expect(() => {
      deriveTokenPriceFromFill(fill);
    }).toThrow(
      /Fill has unpriced assets for both actors: 5d2ed0a5284b0b440de8a3f7/,
    );
  });

  it('should return null for mixed multi-asset fills', () => {
    const fill = {
      _id: '5d2ed0a5284b0b440de8a3f7',
      assets: [
        {
          actor: FILL_ACTOR.MAKER,
          amount: 5000000000000000000,
          price: { USD: 21.8 },
          tokenAddress: '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359',
        },
        {
          actor: FILL_ACTOR.MAKER,
          amount: 5000000000000000000,
          price: { USD: 21.8 },
          tokenAddress: '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359',
        },
        {
          actor: FILL_ACTOR.TAKER,
          amount: 5000000000000000000,
          tokenAddress: '0xe41d2489571d322189246dafa5ebde1f4699f498',
        },
        {
          actor: FILL_ACTOR.TAKER,
          amount: 16000000000000000000,
          tokenAddress: '0x8e870d67f660d95d5be530380d0ec0bd388289e1',
        },
      ],
      conversions: {
        USD: {
          amount: 4000,
        },
      },
    };

    const tokenPrice = deriveTokenPriceFromFill(fill);

    expect(tokenPrice).toBeNull();
  });

  it('should throw an error when the fill relies on a missing token', () => {
    const fill = {
      _id: '5d2ed0a5284b0b440de8a3f7',
      assets: [
        {
          actor: FILL_ACTOR.MAKER,
          amount: 5000000000000000000,
          price: { USD: 21.8 },
          tokenAddress: '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359',
        },
        {
          actor: FILL_ACTOR.MAKER,
          amount: 5000000000000000000,
          price: { USD: 21.8 },
          tokenAddress: '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359',
        },
        {
          actor: FILL_ACTOR.TAKER,
          amount: 5000000000000000000,
          tokenAddress: '0xe41d2489571d322189246dafa5ebde1f4699f498',
        },
      ],
      conversions: {
        USD: {
          amount: 4000,
        },
      },
    };

    expect(() => {
      deriveTokenPriceFromFill(fill);
    }).toThrow(/Fill relies on missing token: 5d2ed0a5284b0b440de8a3f7/);
  });

  it('should throw an error when the fill relies on a token with unresolved decimals', () => {
    const fill = {
      _id: '5d2ed0a5284b0b440de8a3f7',
      assets: [
        {
          actor: FILL_ACTOR.MAKER,
          amount: 5000000000000000000,
          price: { USD: 21.8 },
          tokenAddress: '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359',
        },
        {
          actor: FILL_ACTOR.MAKER,
          amount: 5000000000000000000,
          price: { USD: 21.8 },
          tokenAddress: '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359',
        },
        {
          actor: FILL_ACTOR.TAKER,
          amount: 5000000000000000000,
          token: {
            address: '0xe41d2489571d322189246dafa5ebde1f4699f498',
            type: 0,
          },
          tokenAddress: '0xe41d2489571d322189246dafa5ebde1f4699f498',
        },
      ],
      conversions: {
        USD: {
          amount: 4000,
        },
      },
    };

    expect(() => {
      deriveTokenPriceFromFill(fill);
    }).toThrow(
      /Fill relies on token with unresolved decimals: 5d2ed0a5284b0b440de8a3f7/,
    );
  });

  it('should derive price from non-mixed multi-asset fill', () => {
    const fill = {
      _id: '5d2ed0a5284b0b440de8a3f7',
      assets: [
        {
          actor: FILL_ACTOR.MAKER,
          amount: 5000000000000000000,
          price: { USD: 21.8 },
          tokenAddress: '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359',
        },
        {
          actor: FILL_ACTOR.MAKER,
          amount: 5000000000000000000,
          price: { USD: 21.8 },
          tokenAddress: '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359',
        },
        {
          actor: FILL_ACTOR.TAKER,
          amount: 5000000000000000000,
          token: {
            address: '0xe41d2489571d322189246dafa5ebde1f4699f498',
            decimals: 18,
          },
          tokenAddress: '0xe41d2489571d322189246dafa5ebde1f4699f498',
        },
        {
          actor: FILL_ACTOR.TAKER,
          amount: 10000000000000000000,
          token: {
            address: '0xe41d2489571d322189246dafa5ebde1f4699f498',
            decimals: 18,
          },
          tokenAddress: '0xe41d2489571d322189246dafa5ebde1f4699f498',
        },
      ],
      conversions: {
        USD: {
          amount: 4500,
        },
      },
    };

    const tokenPrice = deriveTokenPriceFromFill(fill);

    expect(tokenPrice).toEqual({
      price: {
        USD: 300,
      },
      tokenAddress: '0xe41d2489571d322189246dafa5ebde1f4699f498',
    });
  });

  it('should derive price from taker side of single-asset fill', () => {
    const fill = {
      _id: '5d2ed0a5284b0b440de8a3f7',
      assets: [
        {
          actor: FILL_ACTOR.MAKER,
          amount: 5000000000000000000,
          price: { USD: 21.8 },
          tokenAddress: '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359',
        },
        {
          actor: FILL_ACTOR.TAKER,
          amount: 5000000000000000000,
          token: {
            address: '0xe41d2489571d322189246dafa5ebde1f4699f498',
            decimals: 18,
          },
          tokenAddress: '0xe41d2489571d322189246dafa5ebde1f4699f498',
        },
      ],
      conversions: {
        USD: {
          amount: 4500,
        },
      },
    };

    const tokenPrice = deriveTokenPriceFromFill(fill);

    expect(tokenPrice).toEqual({
      price: {
        USD: 900,
      },
      tokenAddress: '0xe41d2489571d322189246dafa5ebde1f4699f498',
    });
  });

  it('should derive price from maker side of single-asset fill', () => {
    const fill = {
      _id: '5d2ed0a5284b0b440de8a3f7',
      assets: [
        {
          actor: FILL_ACTOR.MAKER,
          amount: 100000000000000000000,
          token: {
            address: '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359',
            decimals: 18,
          },
          tokenAddress: '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359',
        },
        {
          actor: FILL_ACTOR.TAKER,
          amount: 5000000000000000000,
          tokenAddress: '0xe41d2489571d322189246dafa5ebde1f4699f498',
          price: { USD: 900 },
        },
      ],
      conversions: {
        USD: {
          amount: 4500,
        },
      },
    };

    const tokenPrice = deriveTokenPriceFromFill(fill);

    expect(tokenPrice).toEqual({
      price: {
        USD: 45,
      },
      tokenAddress: '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359',
    });
  });
});
