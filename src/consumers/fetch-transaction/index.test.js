const { fn: fetchTransaction } = require('.');
const { getModel } = require('../../model');
const {
  setupDb,
  tearDownDb,
  resetDb,
  mockLogger,
} = require('../../test-utils');
const { publishJob } = require('../../queues');
const checkTransactionExists = require('../../transactions/check-transaction-exists');
const persistTransaction = require('./persist-transaction');

jest.mock('../../queues');
jest.mock('../../transactions/check-transaction-exists');
jest.mock('./persist-transaction');

const mockOptions = {
  logger: mockLogger,
};

beforeAll(async () => {
  await setupDb();
}, 30000);

beforeEach(() => {
  checkTransactionExists.mockResolvedValue(false);
  persistTransaction.mockResolvedValue(undefined);
});

afterEach(async () => {
  jest.clearAllMocks();
  await resetDb();
}, 30000);

afterAll(async () => {
  await tearDownDb();
}, 30000);

const simpleJob = {
  data: {
    transactionHash:
      '0x4e360e0924eff8a8ed0e85c1ad31ccf711a8ed9787b3edf7cb6fc42b4aa2d035',
    blockNumber: 12799137,
  },
};

describe('consumers/fetch-transaction', () => {
  it('should throw error if transactionHash is null', async () => {
    await expect(
      fetchTransaction({ data: { transactionHash: null } }, mockOptions),
    ).rejects.toThrow(new Error('Invalid transactionHash: null'));
  });

  it('should throw error if transactionHash is undefined', async () => {
    await expect(
      fetchTransaction({ data: { transactionHash: undefined } }, mockOptions),
    ).rejects.toThrow(new Error('Invalid transactionHash: undefined'));
  });

  it('should throw error if transactionHash is empty string', async () => {
    await expect(
      fetchTransaction({ data: { transactionHash: '' } }, mockOptions),
    ).rejects.toThrow(new Error('Invalid transactionHash: '));
  });

  it('should bail early when transaction already exists', async () => {
    checkTransactionExists.mockResolvedValue(true);
    await fetchTransaction(simpleJob, mockOptions);
    expect(persistTransaction).toHaveBeenCalledTimes(0);
  });

  it('should throw an error when block does not exist', async () => {
    await expect(
      fetchTransaction(
        { ...simpleJob, data: { ...simpleJob.data, blockNumber: 114844840 } },
        mockOptions,
      ),
    ).rejects.toThrow(new Error('Block not found: 114844840'));
  });

  it('should throw an error when transaction does not exist', async () => {
    await expect(
      fetchTransaction(
        {
          ...simpleJob,
          data: {
            ...simpleJob.data,
            transactionHash:
              '0xa707981a012761007df2c9099ed1580221d2bdbc4b37f689cb8d35eedd0d505f',
          },
        },
        mockOptions,
      ),
    ).rejects.toThrow(
      new Error(
        'Transaction not found: 0xa707981a012761007df2c9099ed1580221d2bdbc4b37f689cb8d35eedd0d505f',
      ),
    );
  });

  it('should fetch and persist transaction when valid', async () => {
    await fetchTransaction(simpleJob, mockOptions);

    expect(persistTransaction).toHaveBeenCalledTimes(1);
    expect(persistTransaction).toHaveBeenCalledWith(
      {
        affiliateAddress: '0x11ededebf63bef0ea2d2d071bdf88f71543ec6fb',
        blockHash:
          '0xd02edb0c466f425c2583f89c4414276c6e77a5b3f848fabeef4fe9df749a4bcc',
        blockNumber: 12799137,
        data:
          '0x5f5755290000000000000000000000000000000000000000000000000000000000000080000000000000000000000000d417144312dbf50465b1c641d016962017ef62400000000000000000000000000000000000000000000000445f2b32c99caa3bf200000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000000c307846656544796e616d696300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000280000000000000000000000000d417144312dbf50465b1c641d016962017ef624000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000445f2b32c99caa3bf2000000000000000000000000000000000000000000000000037c3680c26c96e5000000000000000000000000000000000000000000000000000000000000012000000000000000000000000000000000000000000000000000081e8e280251c500000000000000000000000011ededebf63bef0ea2d2d071bdf88f71543ec6fb00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000148803ba26d00000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000445f2b32c99caa3bf2000000000000000000000000000000000000000000000000038416b39c6ed6da00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000042d417144312dbf50465b1c641d016962017ef6240000bb8dac17f958d2ee523a2206206994597c13d831ec70001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000000000000000000000000000000000000000869584cd00000000000000000000000011ededebf63bef0ea2d2d071bdf88f71543ec6fb00000000000000000000000000000000000000000000003581e7f23660e976bc0000000000000000000000000000000000000000000000008c',
        date: new Date('2021-07-10T10:31:38.000Z'),
        from: '0xc97fde4dd0c292e9e141c551577e456e646cc3aa',
        gasLimit: 349261,
        gasPrice: '10000000000',
        gasUsed: 261848,
        hash:
          '0x4e360e0924eff8a8ed0e85c1ad31ccf711a8ed9787b3edf7cb6fc42b4aa2d035',
        index: 119,
        nonce: 11,
        quoteDate: new Date('2021-07-10 10:30:20.000Z'),
        to: '0x881d40237659c251811cec9c364ef91dc08d300c',
        value: '0',
      },
      { session: expect.anything() }, // asserting over an actual session is a fools game
    );
  });

  it('should not persist bridge transfer events for transaction which has none', async () => {
    await fetchTransaction(simpleJob, mockOptions);

    const events = await getModel('Event')
      .find()
      .lean();

    expect(events).toHaveLength(0);
  });

  it('should persist bridge transfer events for event which has them', async () => {
    await fetchTransaction(
      {
        data: {
          transactionHash:
            '0x2be4f4bb9eca6bbdb33bc75a5d909a96554fe6a76c858030f730229842965620',
          blockNumber: 11661026,
        },
      },
      mockOptions,
    );

    const events = await getModel('Event')
      .find()
      .lean();

    expect(events).toEqual([
      expect.objectContaining({
        blockNumber: 11661026,
        data: {
          from: '0x36691C4F426Eb8F42f150ebdE43069A31cB080AD',
          fromToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
          fromTokenAmount: '1054989610000000000',
          to: '0x1e4fD24985aD63b7e8A5587364bF5A548af5F6e2',
          toToken: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
          toTokenAmount: '1193031827645918275769',
        },
        logIndex: 104,
        transactionHash:
          '0x2be4f4bb9eca6bbdb33bc75a5d909a96554fe6a76c858030f730229842965620',
        type: 'ERC20BridgeTransfer',
        protocolVersion: 3,
      }),
    ]);
  });

  it('should schedule fetch of sender address type', async () => {
    await fetchTransaction(simpleJob, mockOptions);

    expect(publishJob).toHaveBeenCalledTimes(1);
    expect(publishJob).toHaveBeenCalledWith(
      'eth-data',
      'fetch-address-type',
      { address: '0xc97fde4dd0c292e9e141c551577e456e646cc3aa' },
      {
        jobId: 'fetch-address-type-0xc97fde4dd0c292e9e141c551577e456e646cc3aa',
      },
    );
  });

  it('should schedule fetch of sender address if AddressMetadata document exists but type is unknown', async () => {
    await getModel('AddressMetadata').create({
      address: '0x00000055a65c7b71f171659b8838e1a139b0e518',
    });

    await fetchTransaction(simpleJob, mockOptions);

    expect(publishJob).toHaveBeenCalledTimes(1);
    expect(publishJob).toHaveBeenCalledWith(
      'eth-data',
      'fetch-address-type',
      { address: '0xc97fde4dd0c292e9e141c551577e456e646cc3aa' },
      {
        jobId: 'fetch-address-type-0xc97fde4dd0c292e9e141c551577e456e646cc3aa',
      },
    );
  });

  it('should not schedule fetch of sender address type if already known', async () => {
    await getModel('AddressMetadata').create({
      address: '0xc97fde4dd0c292e9e141c551577e456e646cc3aa',
      isContract: true,
    });

    await fetchTransaction(simpleJob, mockOptions);

    expect(publishJob).toHaveBeenCalledTimes(0);
  });
});
