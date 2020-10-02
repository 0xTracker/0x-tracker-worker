const { Client } = require('@elastic/elasticsearch');
const Mock = require('@elastic/elasticsearch-mock');
const timekeeper = require('timekeeper');

const { getModel } = require('../../model');
const {
  mockLogger,
  resetDb,
  setupDb,
  tearDownDb,
} = require('../../test-utils');
const { publishJob } = require('../../queues');
const elasticsearch = require('../../util/elasticsearch');
const consumer = require('.');

jest.mock('../../queues');
jest.mock('../../util/elasticsearch');

const elasticsearchMock = new Mock();
const mockOptions = {
  logger: mockLogger,
};

beforeAll(async () => {
  const client = new Client({
    node: 'http://localhost:9200',
    Connection: elasticsearchMock.getConnection(),
  });

  elasticsearch.getClient.mockReturnValue(client);
  await setupDb();
}, 30000);

beforeEach(() => {
  timekeeper.freeze('2020-08-02T08:42:24.934Z');
});

afterEach(async () => {
  jest.clearAllMocks();
  await resetDb();
  elasticsearchMock.clearAll();
}, 30000);

afterAll(async () => {
  await tearDownDb();
}, 30000);

describe('consumers/index-fill-traders', () => {
  it('should consume indexing queue', () => {
    expect(consumer.queueName).toBe('indexing');
  });

  it('should consume index-fill-traders jobs', () => {
    expect(consumer.jobName).toBe('index-fill-traders');
  });

  it('should delay job processing when taker type unknown', async () => {
    const job = {
      data: {
        fillDate: new Date('2020-08-02T07:47:28Z'),
        fillId: '5f267c7b545e125452c56e14',
        fillValue: 500,
        maker: '0x903153f55770b7668a497180f7fa93471545ffe2',
        taker: '0xd0f8715fda0c1b564c2087315fb55804eaf1fae9',
        tradeCount: 1,
        transactionHash:
          '0x165a1b8f4fbcf089e48435c2efef12dab5223c560f067f932c8efc3d7c6d74eb',
      },
    };

    await consumer.fn(job, mockOptions);

    expect(mockLogger.warn).toHaveBeenCalledTimes(1);
    expect(mockLogger.warn).toHaveBeenCalledWith(
      'taker address type is unknown: 0xd0f8715fda0c1b564c2087315fb55804eaf1fae9',
    );

    expect(publishJob).toHaveBeenCalledTimes(1);
    expect(publishJob).toHaveBeenCalledWith(
      'indexing',
      'index-fill-traders',
      job.data,
      { delay: 30000 },
    );
  });

  it('should delay job processing when taker is contract and associated transaction not fetched', async () => {
    const job = {
      data: {
        fillDate: new Date('2020-08-02T07:47:28Z'),
        fillId: '5f267c7b545e125452c56e14',
        fillValue: 500,
        maker: '0x903153f55770b7668a497180f7fa93471545ffe2',
        taker: '0xd0f8715fda0c1b564c2087315fb55804eaf1fae9',
        tradeCount: 1,
        transactionHash:
          '0x165a1b8f4fbcf089e48435c2efef12dab5223c560f067f932c8efc3d7c6d74eb',
      },
    };

    const AddressMetadata = getModel('AddressMetadata');

    await AddressMetadata.create({
      address: '0xd0f8715fda0c1b564c2087315fb55804eaf1fae9',
      isContract: true,
    });

    await consumer.fn(job, mockOptions);

    expect(mockLogger.warn).toHaveBeenCalledTimes(1);
    expect(mockLogger.warn).toHaveBeenCalledWith(
      'transaction has not been fetched: 0x165a1b8f4fbcf089e48435c2efef12dab5223c560f067f932c8efc3d7c6d74eb',
    );

    expect(publishJob).toHaveBeenCalledTimes(1);
    expect(publishJob).toHaveBeenCalledWith(
      'indexing',
      'index-fill-traders',
      job.data,
      { delay: 30000 },
    );
  });

  it('should index maker & taker when taker address is not a contract', async () => {
    const job = {
      data: {
        fillDate: new Date('2020-08-02T07:47:28Z'),
        fillId: '5f267c7b545e125452c56e14',
        fillValue: 500,
        maker: '0x903153f55770b7668a497180f7fa93471545ffe2',
        relayerId: 28,
        taker: '0xd0f8715fda0c1b564c2087315fb55804eaf1fae9',
        tradeCount: 1,
        transactionHash:
          '0x165a1b8f4fbcf089e48435c2efef12dab5223c560f067f932c8efc3d7c6d74eb',
      },
    };

    const AddressMetadata = getModel('AddressMetadata');
    let indexingBody;

    elasticsearchMock.add(
      {
        method: 'POST',
        path: '/trader_fills/_bulk',
      },
      ({ body }) => {
        indexingBody = body;

        return { status: 'ok' };
      },
    );

    await AddressMetadata.create({
      address: '0xd0f8715fda0c1b564c2087315fb55804eaf1fae9',
      isContract: false,
    });

    await consumer.fn(job, mockOptions);

    expect(indexingBody).toEqual([
      {
        index: {
          _id: '5f267c7b545e125452c56e14_maker',
        },
      },
      {
        address: '0x903153f55770b7668a497180f7fa93471545ffe2',
        fillId: '5f267c7b545e125452c56e14',
        date: '2020-08-02T07:47:28.000Z',
        relayerId: 28,
        makerFillCount: 1,
        makerFillValue: 500,
        makerTradeCount: 1,
        makerTradeValue: 500,
        totalFillCount: 1,
        totalFillValue: 500,
        totalTradeCount: 1,
        totalTradeValue: 500,
        updatedAt: '2020-08-02T08:42:24.934Z',
      },
      {
        index: {
          _id: '5f267c7b545e125452c56e14_taker',
        },
      },
      {
        address: '0xd0f8715fda0c1b564c2087315fb55804eaf1fae9',
        fillId: '5f267c7b545e125452c56e14',
        date: '2020-08-02T07:47:28.000Z',
        relayerId: 28,
        takerFillCount: 1,
        takerFillValue: 500,
        takerTradeCount: 1,
        takerTradeValue: 500,
        totalFillCount: 1,
        totalFillValue: 500,
        totalTradeCount: 1,
        totalTradeValue: 500,
        updatedAt: '2020-08-02T08:42:24.934Z',
      },
    ]);
  });

  it('should index maker & transaction sender when taker is a contract', async () => {
    const job = {
      data: {
        fillDate: new Date('2020-08-02T07:47:28Z'),
        fillId: '5f661ee4e5267d16e5a70c36',
        fillValue: 500,
        maker: '0x5e8d405cbc564473d85a9a31fbfca76167d69978',
        taker: '0xe33c8e3a0d14a81f0dd7e174830089e82f65fc85',
        tradeCount: 1,
        transactionHash:
          '0x6daec6c63e8c96130f04711409970ead1ec9fdc778090917d8eea7cab140520e',
      },
    };

    const AddressMetadata = getModel('AddressMetadata');
    const Transaction = getModel('Transaction');

    let indexingBody;

    elasticsearchMock.add(
      {
        method: 'POST',
        path: '/trader_fills/_bulk',
      },
      ({ body }) => {
        indexingBody = body;

        return { status: 'ok' };
      },
    );

    await AddressMetadata.create({
      address: '0xe33c8e3a0d14a81f0dd7e174830089e82f65fc85',
      isContract: true,
    });

    await Transaction.create({
      blockHash:
        '0xb7a0059c1aff2e84f7d5b75dd29b57325bd6a8dd0469240689cc52df1df1146a',
      blockNumber: 10893374,
      data:
        '0x000d070a11ced27fd19c7a2bc70fd72adb55bb7025014e00000000000000000000d3d2e2692501a5c9ca623199d38826e513033a17000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000000000000000000000001f9840a85d5af5bf1d1762f925bdaddc4201f984000000000000000000000000e33c8e3a0d14a81f0dd7e174830089e82f65fc85000000000000000000000000000000000000000000000003255b68cdf304cdc40000000000000000000000000000000000000000000000031e171c6104e502420000000000000000000000000000000000000000000000101ad5ea23c2190000014e000000000000000000005e8d405cbc564473d85a9a31fbfca76167d6997800000000000000000000000086003b044f70dac0abc80ac8957305b6370893ed00000000000000000000000000000000000000000000001043561a882930000000000000000000000000000000000000000000000000039f985e76e5df87c00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005f6a05b9b3bb06a8e0c998ead8e30362e7663c1ab2b85d3819bb855485663c92da4296270000000000000000000000001f9840a85d5af5bf1d1762f925bdaddc4201f984000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001b0622adacaeaa57d837c0c7b0814cdabc77dd8997985b753898ace8c7ac4f153a0e888a244c75b330dec0b609daf4a2d1734b7b8e8f95fac8f0845de2b4ee25a602000000000000000000000000000000000000000000000000000000000000727282747ecf0f1e02c1d91b592077453ccaa8aead781317f80b2e6de158b24f00000000000000000000000000000000000000000000039f95fe8e3fc3400000',
      date: new Date('2020-09-19T15:04:28.000Z'),
      from: '0xff59364722a4622a8d33623548926375b1b07767',
      gasLimit: 380000,
      gasPrice: '333000000000',
      gasUsed: 261241,
      hash:
        '0x6daec6c63e8c96130f04711409970ead1ec9fdc778090917d8eea7cab140520e',
      index: 23,
      nonce: '83376',
      to: '0xe33c8e3a0d14a81f0dd7e174830089e82f65fc85',
      value: '0',
    });

    await consumer.fn(job, mockOptions);

    expect(indexingBody).toEqual([
      {
        index: {
          _id: '5f661ee4e5267d16e5a70c36_maker',
        },
      },
      {
        address: '0x5e8d405cbc564473d85a9a31fbfca76167d69978',
        fillId: '5f661ee4e5267d16e5a70c36',
        date: '2020-08-02T07:47:28.000Z',
        makerFillCount: 1,
        makerFillValue: 500,
        makerTradeCount: 1,
        makerTradeValue: 500,
        totalFillCount: 1,
        totalFillValue: 500,
        totalTradeCount: 1,
        totalTradeValue: 500,
        updatedAt: '2020-08-02T08:42:24.934Z',
      },
      {
        index: {
          _id: '5f661ee4e5267d16e5a70c36_taker',
        },
      },
      {
        address: '0xff59364722a4622a8d33623548926375b1b07767',
        fillId: '5f661ee4e5267d16e5a70c36',
        date: '2020-08-02T07:47:28.000Z',
        takerFillCount: 1,
        takerFillValue: 500,
        takerTradeCount: 1,
        takerTradeValue: 500,
        totalFillCount: 1,
        totalFillValue: 500,
        totalTradeCount: 1,
        totalTradeValue: 500,
        updatedAt: '2020-08-02T08:42:24.934Z',
      },
    ]);
  });

  it('should index without value and relayerId if not available', async () => {
    const job = {
      data: {
        fillDate: new Date('2020-08-02T07:47:28Z'),
        fillId: '5f267c7b545e125452c56e14',
        maker: '0x903153f55770b7668a497180f7fa93471545ffe2',
        taker: '0xd0f8715fda0c1b564c2087315fb55804eaf1fae9',
        tradeCount: 1,
        transactionHash:
          '0x165a1b8f4fbcf089e48435c2efef12dab5223c560f067f932c8efc3d7c6d74eb',
      },
    };

    const AddressMetadata = getModel('AddressMetadata');
    let indexingBody;

    elasticsearchMock.add(
      {
        method: 'POST',
        path: '/trader_fills/_bulk',
      },
      ({ body }) => {
        indexingBody = body;

        return { status: 'ok' };
      },
    );

    await AddressMetadata.create({
      address: '0xd0f8715fda0c1b564c2087315fb55804eaf1fae9',
      isContract: false,
    });

    await consumer.fn(job, mockOptions);

    expect(indexingBody).toEqual([
      {
        index: {
          _id: '5f267c7b545e125452c56e14_maker',
        },
      },
      {
        address: '0x903153f55770b7668a497180f7fa93471545ffe2',
        fillId: '5f267c7b545e125452c56e14',
        date: '2020-08-02T07:47:28.000Z',
        makerFillCount: 1,
        makerTradeCount: 1,
        totalFillCount: 1,
        totalTradeCount: 1,
        updatedAt: '2020-08-02T08:42:24.934Z',
      },
      {
        index: {
          _id: '5f267c7b545e125452c56e14_taker',
        },
      },
      {
        address: '0xd0f8715fda0c1b564c2087315fb55804eaf1fae9',
        fillId: '5f267c7b545e125452c56e14',
        date: '2020-08-02T07:47:28.000Z',
        takerFillCount: 1,
        takerTradeCount: 1,
        totalFillCount: 1,
        totalTradeCount: 1,
        updatedAt: '2020-08-02T08:42:24.934Z',
      },
    ]);
  });

  it('should index correct trade value when fill is partial', async () => {
    const job = {
      data: {
        fillDate: new Date('2020-08-02T07:47:28Z'),
        fillId: '5f267c7b545e125452c56e14',
        fillValue: 500,
        maker: '0x903153f55770b7668a497180f7fa93471545ffe2',
        taker: '0xd0f8715fda0c1b564c2087315fb55804eaf1fae9',
        tradeCount: 0.5,
        transactionHash:
          '0x165a1b8f4fbcf089e48435c2efef12dab5223c560f067f932c8efc3d7c6d74eb',
      },
    };

    const AddressMetadata = getModel('AddressMetadata');
    let indexingBody;

    elasticsearchMock.add(
      {
        method: 'POST',
        path: '/trader_fills/_bulk',
      },
      ({ body }) => {
        indexingBody = body;

        return { status: 'ok' };
      },
    );

    await AddressMetadata.create({
      address: '0xd0f8715fda0c1b564c2087315fb55804eaf1fae9',
      isContract: false,
    });

    await consumer.fn(job, mockOptions);

    expect(indexingBody).toEqual([
      {
        index: {
          _id: '5f267c7b545e125452c56e14_maker',
        },
      },
      {
        address: '0x903153f55770b7668a497180f7fa93471545ffe2',
        fillId: '5f267c7b545e125452c56e14',
        date: '2020-08-02T07:47:28.000Z',
        makerFillCount: 1,
        makerFillValue: 500,
        makerTradeCount: 0.5,
        makerTradeValue: 250,
        totalFillCount: 1,
        totalFillValue: 500,
        totalTradeCount: 0.5,
        totalTradeValue: 250,
        updatedAt: '2020-08-02T08:42:24.934Z',
      },
      {
        index: {
          _id: '5f267c7b545e125452c56e14_taker',
        },
      },
      {
        address: '0xd0f8715fda0c1b564c2087315fb55804eaf1fae9',
        fillId: '5f267c7b545e125452c56e14',
        date: '2020-08-02T07:47:28.000Z',
        takerFillCount: 1,
        takerFillValue: 500,
        takerTradeCount: 0.5,
        takerTradeValue: 250,
        totalFillCount: 1,
        totalFillValue: 500,
        totalTradeCount: 0.5,
        totalTradeValue: 250,
        updatedAt: '2020-08-02T08:42:24.934Z',
      },
    ]);
  });

  it('should write log entry on successful completion', async () => {
    const job = {
      data: {
        fillDate: new Date('2020-08-02T07:47:28Z'),
        fillId: '5f267c7b545e125452c56e14',
        maker: '0x903153f55770b7668a497180f7fa93471545ffe2',
        taker: '0xd0f8715fda0c1b564c2087315fb55804eaf1fae9',
        tradeCount: 1,
        transactionHash:
          '0x165a1b8f4fbcf089e48435c2efef12dab5223c560f067f932c8efc3d7c6d74eb',
      },
    };

    const AddressMetadata = getModel('AddressMetadata');

    elasticsearchMock.add(
      {
        method: 'POST',
        path: '/trader_fills/_bulk',
      },
      () => {
        return { status: 'ok' };
      },
    );

    await AddressMetadata.create({
      address: '0xd0f8715fda0c1b564c2087315fb55804eaf1fae9',
      isContract: false,
    });

    await consumer.fn(job, mockOptions);

    expect(mockLogger.info).toHaveBeenCalledTimes(1);
    expect(mockLogger.info).toHaveBeenCalledWith(
      'indexed fill traders: 5f267c7b545e125452c56e14',
    );
  });
});
