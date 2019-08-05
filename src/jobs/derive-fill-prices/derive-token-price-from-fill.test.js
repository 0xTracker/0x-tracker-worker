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
    }).toThrow(/Fill 5d2ed0a5284b0b440de8a3f7 has no unpriced assets/);
  });
});
