const { fn } = require('./');
const { mockLogger } = require('../../test-utils');
const getConversionRate = require('../../rates/get-conversion-rate');
const persistConvertedProtocolFee = require('./persist-converted-protocol-fee');

jest.mock('./persist-converted-protocol-fee');
jest.mock('../../rates/get-conversion-rate');
jest.mock('../../queues');

const mockOptions = {
  logger: mockLogger,
};

beforeEach(() => {
  jest.resetAllMocks();
});

describe('convert protocol fee consumer', () => {
  it('should throw an error when fillId is invalid', async () => {
    await expect(
      fn(
        {
          data: {
            fillDate: '2020-03-29T19:30:00.000Z',
            fillId: 'fubar',
            protocolFee: 1000000000000000,
          },
        },
        mockOptions,
      ),
    ).rejects.toThrow(new Error('Invalid fillId: fubar'));
  });

  it('should throw an error when fillDate is invalid', async () => {
    await expect(
      fn(
        {
          data: {
            fillDate: 'fubar',
            fillId: '5dab535fa75e77be63cfcc29',
            protocolFee: 1000000000000000,
          },
        },
        mockOptions,
      ),
    ).rejects.toThrow(new Error('Invalid fillDate: fubar'));
  });

  it('should throw an error when protocolFee is invalid', async () => {
    await expect(
      fn(
        {
          data: {
            fillDate: '2020-03-29T19:30:00.000Z',
            fillId: '5dab535fa75e77be63cfcc29',
            protocolFee: 'fubar',
          },
        },
        mockOptions,
      ),
    ).rejects.toThrow(new Error('Invalid protocolFee: fubar'));
  });

  it('should persist converted fee when conversion rate available', async () => {
    getConversionRate.mockResolvedValue(180);

    await fn(
      {
        data: {
          fillDate: '2020-03-29T19:30:00.000Z',
          fillId: '5dab535fa75e77be63cfcc29',
          protocolFee: 1000000000000000,
        },
      },
      mockOptions,
    );

    expect(persistConvertedProtocolFee).toHaveBeenCalledTimes(1);
    expect(persistConvertedProtocolFee).toHaveBeenCalledWith(
      '5dab535fa75e77be63cfcc29',
      0.18,
    );
  });

  it('should throw error when conversion rate cannot be fetched', async () => {
    getConversionRate.mockResolvedValueOnce(undefined);

    await expect(
      fn(
        {
          data: {
            fillDate: '2020-03-29T19:30:00.000Z',
            fillId: '5dab535fa75e77be63cfcc29',
            protocolFee: 1000000000000000,
          },
        },
        mockOptions,
      ),
    ).rejects.toThrow(
      new Error(
        'Unable to fetch ETH conversion rate for 2020-03-29T19:30:00.000Z',
      ),
    );
  });
});
