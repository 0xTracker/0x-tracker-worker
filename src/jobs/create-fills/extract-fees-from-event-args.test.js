const extractFeesFromEventArgs = require('./extract-fees-from-event-args');
const V1_EVENT = require('../../fixtures/events/v1');
const V2_EVENT = require('../../fixtures/events/v2');
const V3_EVENT = require('../../fixtures/events/v3');

describe('extractFeesFromEventArgs', () => {
  it('should return undefined for v1 fill event', () => {
    const protocolVersion = 1;
    const fees = extractFeesFromEventArgs(V1_EVENT.data.args, protocolVersion);

    expect(fees).toBeUndefined();
  });

  it('should return undefined for v2 fill event', () => {
    const protocolVersion = 2;
    const fees = extractFeesFromEventArgs(V2_EVENT.data.args, protocolVersion);

    expect(fees).toBeUndefined();
  });

  it('should get fees for v3.0 fill event', () => {
    const protocolVersion = 3;
    const fees = extractFeesFromEventArgs(V3_EVENT.data.args, protocolVersion);

    expect(fees).toEqual([
      {
        amount: {
          token: 500000000000,
        },
        tokenAddress: '0xe41d2489571d322189246dafa5ebde1f4699f498',
        tokenType: 0,
        traderType: 0,
      },
      {
        amount: {
          token: 300000000,
        },
        tokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        tokenType: 0,
        traderType: 1,
      },
    ]);
  });

  it('should return undefined for v3 fill event when makerFeeAssetData is corrupt', () => {
    const protocolVersion = 3;
    const eventArgs = { ...V3_EVENT.data.args, makerFeeAssetData: 'fubar' };
    const fees = extractFeesFromEventArgs(eventArgs, protocolVersion);

    expect(fees).toBeUndefined();
  });

  it('should return undefined for v3 fill event when takerFeeAssetData is corrupt', () => {
    const protocolVersion = 3;
    const eventArgs = { ...V3_EVENT.data.args, takerFeeAssetData: 'fubar' };
    const fees = extractFeesFromEventArgs(eventArgs, protocolVersion);

    expect(fees).toBeUndefined();
  });
});
