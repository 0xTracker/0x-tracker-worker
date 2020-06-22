const { BigNumber } = require('@0x/utils');

const getFeesForEvent = require('./get-fees-for-event');
const V1_EVENT = require('../fixtures/events/v1');
const V2_EVENT = require('../fixtures/events/v2');
const V3_EVENT = require('../fixtures/events/v3');

describe('getFeesFromEvent', () => {
  it('should return fees for v1 fill event', () => {
    const fees = getFeesForEvent(V1_EVENT);

    expect(fees).toEqual([
      {
        amount: { token: new BigNumber(1.2) },
        tokenAddress: '0xe41d2489571d322189246dafa5ebde1f4699f498',
        tokenType: 0,
        traderType: 0,
      },
      {
        amount: { token: new BigNumber(2.3) },
        tokenAddress: '0xe41d2489571d322189246dafa5ebde1f4699f498',
        tokenType: 0,
        traderType: 1,
      },
    ]);
  });

  it('should return undefined for v2 fill event', () => {
    const fees = getFeesForEvent(V2_EVENT);

    expect(fees).toBeUndefined();
  });

  it('should get fees for v3.0 fill event', () => {
    const fees = getFeesForEvent(V3_EVENT);

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
    const fees = getFeesForEvent({
      ...V3_EVENT,
      data: {
        ...V3_EVENT.data,
        args: {
          ...V3_EVENT.data.args,
          makerFeeAssetData:
            '0xdc1600f3000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc200000000000000000000000058b7b96e170e46c07d02fac903cd1b3356b7549f000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000400000000000000000000000006b175474e89094c44da98b954eedeac495271d0f00000000000000000000000000000000000000000000000000000000000a5a2f',
        },
      },
    });

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
    const fees = getFeesForEvent({
      ...V3_EVENT,
      data: {
        ...V3_EVENT.data,
        args: {
          ...V3_EVENT.data.args,
          makerFeeAssetData: 'fubar',
        },
      },
    });

    expect(fees).toBeUndefined();
  });

  it('should return undefined for v3 fill event when takerFeeAssetData is corrupt', () => {
    const fees = getFeesForEvent({
      ...V3_EVENT,
      data: {
        ...V3_EVENT.data,
        args: {
          ...V3_EVENT.data.args,
          takerFeeAssetData: 'fubar',
        },
      },
    });

    expect(fees).toBeUndefined();
  });

  it('should exclude zero value fees', () => {
    const fees = getFeesForEvent({
      ...V3_EVENT,
      data: {
        ...V3_EVENT.data,
        args: {
          ...V3_EVENT.data.args,
          makerFeePaid: 0,
          makerFeeAssetData:
            '0xdc1600f3000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc200000000000000000000000058b7b96e170e46c07d02fac903cd1b3356b7549f000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000400000000000000000000000006b175474e89094c44da98b954eedeac495271d0f00000000000000000000000000000000000000000000000000000000000a5a2f',
        },
      },
    });

    expect(fees).toEqual([
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
});
