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
});
