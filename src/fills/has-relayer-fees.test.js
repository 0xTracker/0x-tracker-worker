const V2_FILL = require('../fixtures/fills/v2');
const hasRelayerFees = require('./has-relayer-fees');

describe('fills/has-relayer-fees', () => {
  it('should return false when fill has no relayer fees', () => {
    const hasFees = hasRelayerFees({ ...V2_FILL, fees: [] });
    expect(hasFees).toBe(false);
  });

  it('should return true when fill has relayer fees', () => {
    const hasFees = hasRelayerFees(V2_FILL);
    expect(hasFees).toBe(true);
  });

  it('should return false when fill has no non-zero value fees', () => {
    const hasFees = hasRelayerFees({
      ...V2_FILL,
      fees: [
        {
          amount: { token: 0, USD: 0 },
          tokenAddress: '0xe41d2489571d322189246dafa5ebde1f4699f498',
          traderType: 0,
        },
        {
          amount: { token: 0, USD: 0 },
          tokenAddress: '0xe41d2489571d322189246dafa5ebde1f4699f498',
          traderType: 1,
        },
      ],
    });
    expect(hasFees).toBe(false);
  });
});
