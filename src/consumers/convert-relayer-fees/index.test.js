const mongoose = require('mongoose');

const { fn: convertRelayerFees } = require('.');
const { getModel } = require('../../model');
const { mockLogger } = require('../../test-utils');
const V2_FILL = require('../../fixtures/fills/v2');
const getConversionRate = require('../../rates/get-conversion-rate');
const testUtils = require('../../test-utils');

jest.mock('../../rates/get-conversion-rate');

const mockOptions = {
  logger: mockLogger,
};

beforeAll(async () => {
  await testUtils.setupDb();
}, 30000);

afterEach(async () => {
  await testUtils.resetDb();
}, 30000);

afterAll(async () => {
  await testUtils.tearDownDb();
}, 30000);

describe('consumers/convert-relayer-fees', () => {
  it('should throw an error when fillId format is invalid', async () => {
    await expect(
      convertRelayerFees({ data: { fillId: 'fubar' } }, mockOptions),
    ).rejects.toThrow(new Error('Invalid fillId: fubar'));
  });

  it('should throw an error when fill does not exist', async () => {
    await expect(
      convertRelayerFees(
        { data: { fillId: '5a1034ea01d64f914ce920d2' } },
        mockOptions,
      ),
    ).rejects.toThrow(new Error('Cannot find fill: 5a1034ea01d64f914ce920d2'));
  });

  it('should skip conversion when fill does not have any fees', async () => {
    const fill = {
      ...V2_FILL,
      fees: [],
    };
    const Fill = getModel('Fill');
    await Fill.create(fill);

    await convertRelayerFees(
      { data: { fillId: '5e01056923573c61d846f51d' } },
      mockOptions,
    );

    const fillAfterRun = await Fill.findById('5e01056923573c61d846f51d').lean();
    expect(fillAfterRun).toEqual(fill);
  });

  it('should skip conversion when fill does not have any convertible fees', async () => {
    const fill = {
      ...V2_FILL,
      fees: [
        {
          _id: new mongoose.Types.ObjectId('5f0b34ed4524dc43d883a92b'),
          amount: { token: 5000000000000000000 },
          tokenAddress: '0x0d8775f648430679a709e98d2b0cb6250d2887ef',
          traderType: 0,
        },
        {
          _id: new mongoose.Types.ObjectId('5f0b34ed4524dc43d883a92a'),
          amount: { token: 3000000000000000000 },
          tokenAddress: '0x0d8775f648430679a709e98d2b0cb6250d2887ef',
          traderType: 1,
        },
      ],
    };
    const Fill = getModel('Fill');
    await Fill.create(fill);

    await convertRelayerFees(
      { data: { fillId: '5e01056923573c61d846f51d' } },
      mockOptions,
    );

    const fillAfterRun = await Fill.findById('5e01056923573c61d846f51d').lean();
    expect(fillAfterRun).toEqual(fill);
  });

  it('should convert fees when fill has convertible fees', async () => {
    getConversionRate.mockImplementation((fromSymbol, toSymbol, date) => {
      if (
        fromSymbol === 'ZRX' &&
        toSymbol === 'USD' &&
        date.toISOString() === '2019-12-23T18:15:16.000Z'
      ) {
        return 0.35;
      }

      return undefined;
    });

    const Fill = getModel('Fill');
    await Fill.create(V2_FILL);

    await convertRelayerFees(
      { data: { fillId: '5e01056923573c61d846f51d' } },
      mockOptions,
    );

    const fillAfterRun = await Fill.findById('5e01056923573c61d846f51d').lean();

    expect(fillAfterRun.fees).toEqual([
      {
        _id: new mongoose.Types.ObjectId('5f0b34ed4524dc43d883a92b'),
        amount: {
          USD: 1.75,
          token: 5000000000000000000,
        },
        tokenAddress: '0xe41d2489571d322189246dafa5ebde1f4699f498',
        traderType: 0,
      },
      {
        _id: new mongoose.Types.ObjectId('5f0b34ed4524dc43d883a92a'),
        amount: {
          USD: 1.0499999999999998,
          token: 3000000000000000000,
        },
        tokenAddress: '0xe41d2489571d322189246dafa5ebde1f4699f498',
        traderType: 1,
      },
    ]);
  });
});
