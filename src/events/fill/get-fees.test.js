const getFees = require('./get-fees');
const V1_EVENT = require('../../fixtures/events/v1');
const V2_EVENT = require('../../fixtures/events/v2');
const V3_EVENT = require('../../fixtures/events/v3');

describe('events/fill/getFees', () => {
  it('should return undefined for v1 fill event', () => {
    const protocolVersion = 1;
    const fees = getFees(V1_EVENT.data.args, protocolVersion);

    expect(fees).toBeUndefined();
  });

  it('should return undefined for v2 fill event', () => {
    const protocolVersion = 2;
    const fees = getFees(V2_EVENT.data.args, protocolVersion);

    expect(fees).toBeUndefined();
  });

  it('should get fees for v3.0 fill event', () => {
    const protocolVersion = 3;
    const fees = getFees(V3_EVENT.data.args, protocolVersion);

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

  it('should extract bridged fees for v3.0 fill event', () => {
    const args = {
      ...V3_EVENT.data.args,
      makerFeeAssetData:
        '0xdc1600f3000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc200000000000000000000000058b7b96e170e46c07d02fac903cd1b3356b7549f000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000400000000000000000000000006b175474e89094c44da98b954eedeac495271d0f00000000000000000000000000000000000000000000000000000000000a5a2f',
    };
    const protocolVersion = 3;
    const fees = getFees(args, protocolVersion);

    expect(fees).toEqual([
      {
        amount: { token: 500000000000 },
        bridgeAddress: '0x58b7b96e170e46c07d02fac903cd1b3356b7549f',
        bridgeData:
          '0x0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f00000000000000000000000000000000000000000000000000000000000a5a2f',
        tokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
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
    const fees = getFees(eventArgs, protocolVersion);

    expect(fees).toBeUndefined();
  });

  it('should return undefined for v3 fill event when takerFeeAssetData is corrupt', () => {
    const protocolVersion = 3;
    const eventArgs = { ...V3_EVENT.data.args, takerFeeAssetData: 'fubar' };
    const fees = getFees(eventArgs, protocolVersion);

    expect(fees).toBeUndefined();
  });
});
