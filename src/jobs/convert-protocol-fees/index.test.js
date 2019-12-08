const convertProtocolFees = require('./');
const getConversionRate = require('../../rates/get-conversion-rate');
const getFillsWithUnconvertedProtocolFees = require('./get-fills-with-unconverted-protocol-fees');
const persistConvertedProtocolFee = require('./persist-converted-protocol-fee');

jest.mock('./get-fills-with-unconverted-protocol-fees');
jest.mock('./persist-converted-protocol-fee');
jest.mock('../../rates/get-conversion-rate');

beforeEach(() => {
  jest.resetAllMocks();
});

describe('convert protocol fees job', () => {
  it('should bail early when no fills found with unconverted protocol fees', async () => {
    getFillsWithUnconvertedProtocolFees.mockResolvedValue([]);

    await convertProtocolFees({ batchSize: 100 });

    expect(persistConvertedProtocolFee).toHaveBeenCalledTimes(0);
  });

  it('should persist converted fees when conversion rate available', async () => {
    getFillsWithUnconvertedProtocolFees.mockResolvedValue([
      {
        id: '5dab535fa75e77be63cfcc29',
        protocolFee: 1000000000000000,
      },
      {
        id: '5a1034e001d64f914ce91305',
        protocolFee: 2000000000000000,
      },
    ]);
    getConversionRate.mockResolvedValue(180);

    await convertProtocolFees({ batchSize: 100 });

    expect(persistConvertedProtocolFee).toHaveBeenCalledTimes(2);
    expect(persistConvertedProtocolFee).toHaveBeenNthCalledWith(
      1,
      '5dab535fa75e77be63cfcc29',
      0.18,
    );
    expect(persistConvertedProtocolFee).toHaveBeenNthCalledWith(
      2,
      '5a1034e001d64f914ce91305',
      0.36,
    );
  });

  it('should skip fill when conversion rate cannot be fetched', async () => {
    getFillsWithUnconvertedProtocolFees.mockResolvedValue([
      {
        id: '5dab535fa75e77be63cfcc29',
        protocolFee: 1000000000000000,
      },
      {
        id: '5a1034e001d64f914ce91305',
        protocolFee: 2000000000000000,
      },
    ]);

    getConversionRate.mockResolvedValueOnce(undefined);
    getConversionRate.mockResolvedValueOnce(180);

    await convertProtocolFees({ batchSize: 100 });

    expect(persistConvertedProtocolFee).toHaveBeenCalledTimes(1);
    expect(persistConvertedProtocolFee).toHaveBeenNthCalledWith(
      1,
      '5a1034e001d64f914ce91305',
      0.36,
    );
  });
});
