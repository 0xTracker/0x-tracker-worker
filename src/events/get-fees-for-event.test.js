const { UnsupportedAssetError } = require('../errors');
const getFeesForEvent = require('./get-fees-for-event');
const V1_EVENT = require('../fixtures/events/v1');
const V2_EVENT = require('../fixtures/events/v2');
const V3_EVENT = require('../fixtures/events/v3');

const eventWithArgs = (event, args) => ({
  ...event,
  data: { ...event.data, args: { ...event.data.args, ...args } },
});

describe('getFeesFromEvent', () => {
  it('should return fees for v1 fill event', () => {
    const fees = getFeesForEvent(V1_EVENT);

    expect(fees).toEqual([
      {
        amount: { token: 1200000000000000000 },
        tokenAddress: '0xe41d2489571d322189246dafa5ebde1f4699f498',
        tokenType: 0,
        traderType: 0,
      },
      {
        amount: { token: 2300000000000000000 },
        tokenAddress: '0xe41d2489571d322189246dafa5ebde1f4699f498',
        tokenType: 0,
        traderType: 1,
      },
    ]);
  });

  it('should exclude zero value fees from v1 fill event', () => {
    const event = eventWithArgs(V1_EVENT, { paidMakerFee: 0 });
    const fees = getFeesForEvent(event);

    expect(fees).toEqual([
      {
        amount: { token: 2300000000000000000 },
        tokenAddress: '0xe41d2489571d322189246dafa5ebde1f4699f498',
        tokenType: 0,
        traderType: 1,
      },
    ]);
  });

  it('should return empty array for v1 fill event with no fees', () => {
    const event = eventWithArgs(V1_EVENT, { paidMakerFee: 0, paidTakerFee: 0 });
    const fees = getFeesForEvent(event);

    expect(fees).toEqual([]);
  });

  it('should return fees for v2 fill event', () => {
    const fees = getFeesForEvent(V2_EVENT);

    expect(fees).toEqual([
      {
        amount: {
          token: 1200000000000000000,
        },
        tokenAddress: '0xe41d2489571d322189246dafa5ebde1f4699f498',
        tokenType: 0,
        traderType: 0,
      },
      {
        amount: {
          token: 2800000000000000000,
        },
        tokenAddress: '0xe41d2489571d322189246dafa5ebde1f4699f498',
        tokenType: 0,
        traderType: 1,
      },
    ]);
  });

  it('should exclude zero value fees from v2 fill event', () => {
    const event = eventWithArgs(V2_EVENT, { makerFeePaid: 0 });
    const fees = getFeesForEvent(event);

    expect(fees).toEqual([
      {
        amount: {
          token: 2800000000000000000,
        },
        tokenAddress: '0xe41d2489571d322189246dafa5ebde1f4699f498',
        tokenType: 0,
        traderType: 1,
      },
    ]);
  });

  it('should return empty array for v2 fill event with no fees', () => {
    const event = eventWithArgs(V2_EVENT, { makerFeePaid: 0, takerFeePaid: 0 });
    const fees = getFeesForEvent(event);

    expect(fees).toEqual([]);
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
    const event = eventWithArgs(V3_EVENT, {
      makerFeeAssetData:
        '0xdc1600f3000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc200000000000000000000000058b7b96e170e46c07d02fac903cd1b3356b7549f000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000400000000000000000000000006b175474e89094c44da98b954eedeac495271d0f00000000000000000000000000000000000000000000000000000000000a5a2f',
    });
    const fees = getFeesForEvent(event);

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

  it('should throw UnsupportedAssetError for v3 fill event when makerFeeAssetData is corrupt', () => {
    const event = eventWithArgs(V3_EVENT, {
      makerFeeAssetData: 'fubar',
    });
    expect(() => {
      getFeesForEvent(event);
    }).toThrow(UnsupportedAssetError);
  });

  it('should throw UnsupportedAssetError for v3 fill event when takerFeeAssetData is corrupt', () => {
    const event = eventWithArgs(V3_EVENT, {
      takerFeeAssetData: 'fubar',
    });
    expect(() => {
      getFeesForEvent(event);
    }).toThrow(UnsupportedAssetError);
  });

  it('should exclude zero value fees from v3 fill event', () => {
    const event = eventWithArgs(V3_EVENT, {
      makerFeePaid: 0,
      makerFeeAssetData:
        '0xdc1600f3000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc200000000000000000000000058b7b96e170e46c07d02fac903cd1b3356b7549f000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000400000000000000000000000006b175474e89094c44da98b954eedeac495271d0f00000000000000000000000000000000000000000000000000000000000a5a2f',
    });
    const fees = getFeesForEvent(event);

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

  it('should return empty array when v3 fill event has no fees', () => {
    const event = eventWithArgs(V3_EVENT, {
      makerFeePaid: 0,
      makerFeeAssetData: '0x',
      takerFeePaid: 0,
      takerFeeAssetData: '0x',
    });
    const fees = getFeesForEvent(event);

    expect(fees).toEqual([]);
  });
});
