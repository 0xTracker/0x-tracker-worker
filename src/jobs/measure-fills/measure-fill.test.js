const { getModel } = require('../../model');
const { publishJob } = require('../../queues');
const getConversionRate = require('../../rates/get-conversion-rate');
const measureFill = require('./measure-fill');
const testUtils = require('../../test-utils');
const V3_FILL = require('../../fixtures/fills/v3_unmeasured');

jest.mock('../../rates/get-conversion-rate');
jest.mock('../../queues');

beforeAll(async () => {
  await testUtils.setupDb();
}, 30000);

afterEach(async () => {
  await testUtils.resetDb();
  jest.resetAllMocks();
}, 30000);

afterAll(async () => {
  await testUtils.tearDownDb();
}, 30000);

describe('jobs/measure-fills/measure-fill', () => {
  it('should measure fill when one side consists solely of a base token (USDC)', async () => {
    getConversionRate.mockResolvedValue(1); // 1 USD = 1USDC

    const Fill = getModel('Fill');
    const fill = new Fill(V3_FILL);

    await measureFill(fill);

    expect(fill.conversions).toEqual({ USD: { amount: 1674.924411 } });
    expect(fill.hasValue).toBe(true);
    expect(fill.immeasurable).toBe(false);
  });

  it('should index value after measurement', async () => {
    getConversionRate.mockResolvedValue(1); // 1 USD = 1USDC

    const Fill = getModel('Fill');
    const fill = new Fill(V3_FILL);

    await measureFill(fill);

    expect(publishJob).toHaveBeenCalledWith(
      'fill-indexing',
      'index-fill-value',
      {
        fillId: '5e3e9abbb2227b1f0e73be5f',
        relayerId: 31,
        value: 1674.924411,
      },
      {
        jobId: 'index-fill-value-5e3e9abbb2227b1f0e73be5f',
      },
    );
  });

  it('should index traders after measurement', async () => {
    getConversionRate.mockResolvedValue(1); // 1 USD = 1USDC

    const Fill = getModel('Fill');
    const fill = new Fill(V3_FILL);

    await measureFill(fill);

    expect(publishJob).toHaveBeenCalledWith('indexing', 'index-fill-traders', {
      appIds: [],
      fillId: '5e3e9abbb2227b1f0e73be5f',
      fillDate: new Date('2020-02-08T11:21:14.000Z'),
      fillValue: 1674.924411,
      maker: '0x533344cfdf2a3e911e2cf4c6f5ed08e791f5355f',
      relayerId: 31,
      taker: '0x4ef40d1bf0983899892946830abf99eca2dbc5ce',
      tradeCount: 1,
      transactionHash:
        '0x846d405f1ab48414c9a32f537c7b247e87e5770cc41dfe4255bc480710ec46f6',
    });
  });

  it('should update app_fills index after measurement when fill is associated with apps', async () => {
    getConversionRate.mockResolvedValue(1); // 1 USD = 1USDC

    const Fill = getModel('Fill');
    const fill = new Fill({
      _id: '5e3e9abbb2227b1f0e73be5f',
      status: 1,
      attributions: [
        {
          entityId: '5067df8b-f9cd-4a34-aee1-38d607100145',
          type: 0,
        },
        { entityId: 'dda3bbb3-333b-437a-ae96-150987c33617', type: 1 },
      ],
      assets: [
        {
          tokenResolved: true,
          _id: '5e3e9abbb2227b1f0e73be61',
          amount: 1674924411,
          tokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          bridgeAddress: '0x533344cfdf2a3e911e2cf4c6f5ed08e791f5355f',
          bridgeData:
            '0x000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
          actor: 0,
        },
        {
          tokenResolved: true,
          _id: '5e3e9abbb2227b1f0e73be60',
          amount: 7.45216100214005e18,
          tokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
          actor: 1,
        },
      ],
      blockHash:
        '0x2d28446636839915b273eb93243dd6295f03d8117a55f0e6fb4f3cdc582d88e8',
      blockNumber: 9441755,
      date: '2020-02-08T11:21:14.000Z',
      eventId: '5e3e9a370834b939aa28452c',
      fees: [],
      feeRecipient: '0x1000000000000000000000000000000000000011',
      logIndex: 30,
      maker: '0x533344cfdf2a3e911e2cf4c6f5ed08e791f5355f',
      orderHash:
        '0x0ccbf1bc14e19be3a4c422b18bb1c9870b5e0a75cfb75b694688b07380c13732',
      protocolFee: 1500000000150000.0,
      protocolVersion: 3,
      relayerId: 31,
      senderAddress: '0x4ef40d1bf0983899892946830abf99eca2dbc5ce',
      taker: '0x4ef40d1bf0983899892946830abf99eca2dbc5ce',
      transactionHash:
        '0x846d405f1ab48414c9a32f537c7b247e87e5770cc41dfe4255bc480710ec46f6',
    });

    await measureFill(fill);

    expect(publishJob).toHaveBeenCalledWith('indexing', 'index-app-fills', {
      attributions: [
        {
          entityId: '5067df8b-f9cd-4a34-aee1-38d607100145',
          type: 0,
        },
        { entityId: 'dda3bbb3-333b-437a-ae96-150987c33617', type: 1 },
      ],
      fillDate: new Date('2020-02-08T11:21:14.000Z'),
      fillId: '5e3e9abbb2227b1f0e73be5f',
      maker: '0x533344cfdf2a3e911e2cf4c6f5ed08e791f5355f',
      taker: '0x4ef40d1bf0983899892946830abf99eca2dbc5ce',
      tradeCount: 1,
      tradeValue: 1674.924411,
      transactionHash:
        '0x846d405f1ab48414c9a32f537c7b247e87e5770cc41dfe4255bc480710ec46f6',
    });
  });
});
