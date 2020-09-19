const { Client } = require('@elastic/elasticsearch');
const Mock = require('@elastic/elasticsearch-mock');

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

  // it('should update documents for specified attributions', async () => {
  //   timekeeper.freeze('2020-08-02T08:42:24.934Z');
  //   elasticsearchMock.add(
  //     {
  //       method: 'POST',
  //       path: '/app_fill_attributions/_bulk',
  //     },
  //     ({ body }) => {
  //       expect(body).toEqual([
  //         {
  //           update: {
  //             _id:
  //               '5980a15c-e450-40d3-8ef4-c54a37363ed0_5f267c7b545e125452c56e14',
  //           },
  //         },
  //         {
  //           doc: {
  //             appId: '5980a15c-e450-40d3-8ef4-c54a37363ed0',
  //             date: '2020-08-02T07:47:28.000Z',
  //             fillId: '5f267c7b545e125452c56e14',
  //             relayedTrades: 1,
  //             relayedVolume: 1520,
  //             totalTrades: 1,
  //             totalVolume: 1520,
  //             updatedAt: '2020-08-02T08:42:24.934Z',
  //           },
  //           doc_as_upsert: true,
  //         },
  //         {
  //           update: {
  //             _id:
  //               '449fcf3c-5f05-4cb4-b7bd-cf7c86bd6576_5f267c7b545e125452c56e14',
  //           },
  //         },
  //         {
  //           doc: {
  //             appId: '449fcf3c-5f05-4cb4-b7bd-cf7c86bd6576',
  //             date: '2020-08-02T07:47:28.000Z',
  //             fillId: '5f267c7b545e125452c56e14',
  //             sourcedTrades: 1,
  //             sourcedVolume: 1520,
  //             totalTrades: 1,
  //             totalVolume: 1520,
  //             updatedAt: '2020-08-02T08:42:24.934Z',
  //           },
  //           doc_as_upsert: true,
  //         },
  //       ]);
  //       return { status: 'ok' };
  //     },
  //   );

  //   await consumer.fn(
  //     {
  //       data: {
  //         date: new Date('2020-08-02T07:47:28Z'),
  //         fillId: '5f267c7b545e125452c56e14',
  //         attributions: [
  //           {
  //             appId: '5980a15c-e450-40d3-8ef4-c54a37363ed0',
  //             relayedTrades: 1,
  //             relayedVolume: 1520,
  //             totalTrades: 1,
  //             totalVolume: 1520,
  //           },
  //           {
  //             appId: '449fcf3c-5f05-4cb4-b7bd-cf7c86bd6576',
  //             sourcedTrades: 1,
  //             sourcedVolume: 1520,
  //             totalTrades: 1,
  //             totalVolume: 1520,
  //           },
  //         ],
  //       },
  //     },
  //     mockOptions,
  //   );
  // });

  // it('should update documents for specified attributions without volume', async () => {
  //   timekeeper.freeze('2020-08-02T08:42:24.934Z');
  //   elasticsearchMock.add(
  //     {
  //       method: 'POST',
  //       path: '/app_fill_attributions/_bulk',
  //     },
  //     ({ body }) => {
  //       expect(body).toEqual([
  //         {
  //           update: {
  //             _id:
  //               '5980a15c-e450-40d3-8ef4-c54a37363ed0_5f267c7b545e125452c56e14',
  //           },
  //         },
  //         {
  //           doc: {
  //             appId: '5980a15c-e450-40d3-8ef4-c54a37363ed0',
  //             date: '2020-08-02T07:47:28.000Z',
  //             fillId: '5f267c7b545e125452c56e14',
  //             relayedTrades: 1,
  //             totalTrades: 1,
  //             updatedAt: '2020-08-02T08:42:24.934Z',
  //           },
  //           doc_as_upsert: true,
  //         },
  //         {
  //           update: {
  //             _id:
  //               '449fcf3c-5f05-4cb4-b7bd-cf7c86bd6576_5f267c7b545e125452c56e14',
  //           },
  //         },
  //         {
  //           doc: {
  //             appId: '449fcf3c-5f05-4cb4-b7bd-cf7c86bd6576',
  //             date: '2020-08-02T07:47:28.000Z',
  //             fillId: '5f267c7b545e125452c56e14',
  //             sourcedTrades: 1,
  //             totalTrades: 1,
  //             updatedAt: '2020-08-02T08:42:24.934Z',
  //           },
  //           doc_as_upsert: true,
  //         },
  //       ]);
  //       return { status: 'ok' };
  //     },
  //   );

  //   await consumer.fn(
  //     {
  //       data: {
  //         date: new Date('2020-08-02T07:47:28Z'),
  //         fillId: '5f267c7b545e125452c56e14',
  //         attributions: [
  //           {
  //             appId: '5980a15c-e450-40d3-8ef4-c54a37363ed0',
  //             relayedTrades: 1,
  //             totalTrades: 1,
  //           },
  //           {
  //             appId: '449fcf3c-5f05-4cb4-b7bd-cf7c86bd6576',
  //             sourcedTrades: 1,
  //             totalTrades: 1,
  //           },
  //         ],
  //       },
  //     },
  //     mockOptions,
  //   );
  // });
});
