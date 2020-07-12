const { FILL_ACTOR } = require('../../constants');
const checkIsFillMeasurable = require('./check-is-fill-measurable');

describe('check is fill measurable', () => {
  it('should return false when assets is null', () => {
    const fill = { assets: null };
    const isMeasurable = checkIsFillMeasurable(fill);

    expect(isMeasurable).toBe(false);
  });

  it('should return false when assets is empty', () => {
    const fill = { assets: [] };
    const isMeasurable = checkIsFillMeasurable(fill);

    expect(isMeasurable).toBe(false);
  });

  it('should return false when taker assets missing and maker assets are not all base tokens', () => {
    const fill = {
      assets: [
        {
          actor: FILL_ACTOR.MAKER,
          tokenAddress: '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359', // DAI
        },
        {
          actor: FILL_ACTOR.MAKER,
          tokenAddress: '0x0d8775f648430679a709e98d2b0cb6250d2887ef', // BAT
        },
      ],
    };

    const isMeasurable = checkIsFillMeasurable(fill);

    expect(isMeasurable).toBe(false);
  });

  it('should return false when maker assets missing and taker assets are not all base tokens', () => {
    const fill = {
      assets: [
        {
          actor: FILL_ACTOR.TAKER,
          tokenAddress: '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359', // DAI
        },
        {
          actor: FILL_ACTOR.TAKER,
          tokenAddress: '0x0d8775f648430679a709e98d2b0cb6250d2887ef', // BAT
        },
      ],
    };

    const isMeasurable = checkIsFillMeasurable(fill);

    expect(isMeasurable).toBe(false);
  });

  it('should return true when all maker assets are base tokens', () => {
    const fill = {
      assets: [
        {
          actor: FILL_ACTOR.MAKER,
          tokenAddress: '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359', // DAI
        },
        {
          actor: FILL_ACTOR.MAKER,
          tokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
        },
        {
          actor: FILL_ACTOR.TAKER,
          tokenAddress: '0x0d8775f648430679a709e98d2b0cb6250d2887ef', // BAT
        },
        {
          actor: FILL_ACTOR.TAKER,
          tokenAddress: '0xc9bf6dacf0849ecbef4a6adffbc717c7fa0f7724', // KAB
        },
      ],
    };

    const isMeasurable = checkIsFillMeasurable(fill);

    expect(isMeasurable).toBe(true);
  });

  it('should return true when all taker assets are base tokens', () => {
    const fill = {
      assets: [
        {
          actor: FILL_ACTOR.MAKER,
          tokenAddress: '0x0d8775f648430679a709e98d2b0cb6250d2887ef', // BAT
        },
        {
          actor: FILL_ACTOR.MAKER,
          tokenAddress: '0xc9bf6dacf0849ecbef4a6adffbc717c7fa0f7724', // KAB
        },
        {
          actor: FILL_ACTOR.TAKER,
          tokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
        },
        {
          actor: FILL_ACTOR.TAKER,
          tokenAddress: '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359', // DAI
        },
      ],
    };

    const isMeasurable = checkIsFillMeasurable(fill);

    expect(isMeasurable).toBe(true);
  });

  it('should return false when no side consists solely of base tokens', () => {
    const fill = {
      assets: [
        {
          actor: FILL_ACTOR.MAKER,
          tokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
        },
        {
          actor: FILL_ACTOR.MAKER,
          tokenAddress: '0xc9bf6dacf0849ecbef4a6adffbc717c7fa0f7724', // KAB
        },
        {
          actor: FILL_ACTOR.TAKER,
          tokenAddress: '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359', // DAI
        },
        {
          actor: FILL_ACTOR.TAKER,
          tokenAddress: '0x0d8775f648430679a709e98d2b0cb6250d2887ef', // BAT
        },
      ],
    };

    const isMeasurable = checkIsFillMeasurable(fill);

    expect(isMeasurable).toBe(false);
  });

  it('should return true when all maker assets are the same base token', () => {
    const fill = {
      assets: [
        {
          actor: FILL_ACTOR.MAKER,
          tokenAddress: '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359', // DAI
        },
        {
          actor: FILL_ACTOR.MAKER,
          tokenAddress: '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359', // USDC
        },
        {
          actor: FILL_ACTOR.TAKER,
          tokenAddress: '0x0d8775f648430679a709e98d2b0cb6250d2887ef', // BAT
        },
        {
          actor: FILL_ACTOR.TAKER,
          tokenAddress: '0xc9bf6dacf0849ecbef4a6adffbc717c7fa0f7724', // KAB
        },
      ],
    };

    const isMeasurable = checkIsFillMeasurable(fill);

    expect(isMeasurable).toBe(true);
  });

  it('should return true when all taker assets are the same base token', () => {
    const fill = {
      assets: [
        {
          actor: FILL_ACTOR.MAKER,
          tokenAddress: '0x0d8775f648430679a709e98d2b0cb6250d2887ef', // BAT
        },
        {
          actor: FILL_ACTOR.MAKER,
          tokenAddress: '0xc9bf6dacf0849ecbef4a6adffbc717c7fa0f7724', // KAB
        },
        {
          actor: FILL_ACTOR.TAKER,
          tokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
        },
        {
          actor: FILL_ACTOR.TAKER,
          tokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
        },
      ],
    };

    const isMeasurable = checkIsFillMeasurable(fill);

    expect(isMeasurable).toBe(true);
  });
});
