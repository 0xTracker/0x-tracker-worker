const { Client } = require('@elastic/elasticsearch');
const Mock = require('@elastic/elasticsearch-mock');
const timekeeper = require('timekeeper');

const elasticsearch = require('../util/elasticsearch');
const indexAppFillAttributions = require('./index-app-fill-attributions');

jest.mock('../util/elasticsearch');

const mock = new Mock();

beforeAll(() => {
  const client = new Client({
    node: 'http://localhost:9200',
    Connection: mock.getConnection(),
  });
  elasticsearch.getClient.mockReturnValue(client);
});

afterEach(() => {
  mock.clearAll();
});

describe('consumers/index-app-fill-attributions', () => {
  it('should update documents for specified attributions', async () => {
    timekeeper.freeze('2020-08-02T08:42:24.934Z');
    mock.add(
      {
        method: 'POST',
        path: '/app_fill_attributions/_bulk',
      },
      ({ body }) => {
        expect(body).toEqual([
          {
            update: {
              _id:
                '5980a15c-e450-40d3-8ef4-c54a37363ed0_5f267c7b545e125452c56e14',
            },
          },
          {
            doc: {
              appId: '5980a15c-e450-40d3-8ef4-c54a37363ed0',
              date: '2020-08-02T07:47:28.000Z',
              fillId: '5f267c7b545e125452c56e14',
              relayedTrades: 1,
              relayedVolume: 1520,
              totalTrades: 1,
              totalVolume: 1520,
              updatedAt: '2020-08-02T08:42:24.934Z',
            },
            doc_as_upsert: true,
          },
          {
            update: {
              _id:
                '449fcf3c-5f05-4cb4-b7bd-cf7c86bd6576_5f267c7b545e125452c56e14',
            },
          },
          {
            doc: {
              appId: '449fcf3c-5f05-4cb4-b7bd-cf7c86bd6576',
              date: '2020-08-02T07:47:28.000Z',
              fillId: '5f267c7b545e125452c56e14',
              sourcedTrades: 1,
              sourcedVolume: 1520,
              totalTrades: 1,
              totalVolume: 1520,
              updatedAt: '2020-08-02T08:42:24.934Z',
            },
            doc_as_upsert: true,
          },
        ]);
        return { status: 'ok' };
      },
    );

    await indexAppFillAttributions.fn({
      data: {
        date: new Date('2020-08-02T07:47:28Z'),
        fillId: '5f267c7b545e125452c56e14',
        attributions: [
          {
            appId: '5980a15c-e450-40d3-8ef4-c54a37363ed0',
            relayedTrades: 1,
            relayedVolume: 1520,
            totalTrades: 1,
            totalVolume: 1520,
          },
          {
            appId: '449fcf3c-5f05-4cb4-b7bd-cf7c86bd6576',
            sourcedTrades: 1,
            sourcedVolume: 1520,
            totalTrades: 1,
            totalVolume: 1520,
          },
        ],
      },
    });
  });

  it('should update documents for specified attributions without volume', async () => {
    timekeeper.freeze('2020-08-02T08:42:24.934Z');
    mock.add(
      {
        method: 'POST',
        path: '/app_fill_attributions/_bulk',
      },
      ({ body }) => {
        expect(body).toEqual([
          {
            update: {
              _id:
                '5980a15c-e450-40d3-8ef4-c54a37363ed0_5f267c7b545e125452c56e14',
            },
          },
          {
            doc: {
              appId: '5980a15c-e450-40d3-8ef4-c54a37363ed0',
              date: '2020-08-02T07:47:28.000Z',
              fillId: '5f267c7b545e125452c56e14',
              relayedTrades: 1,
              totalTrades: 1,
              updatedAt: '2020-08-02T08:42:24.934Z',
            },
            doc_as_upsert: true,
          },
          {
            update: {
              _id:
                '449fcf3c-5f05-4cb4-b7bd-cf7c86bd6576_5f267c7b545e125452c56e14',
            },
          },
          {
            doc: {
              appId: '449fcf3c-5f05-4cb4-b7bd-cf7c86bd6576',
              date: '2020-08-02T07:47:28.000Z',
              fillId: '5f267c7b545e125452c56e14',
              sourcedTrades: 1,
              totalTrades: 1,
              updatedAt: '2020-08-02T08:42:24.934Z',
            },
            doc_as_upsert: true,
          },
        ]);
        return { status: 'ok' };
      },
    );

    await indexAppFillAttributions.fn({
      data: {
        date: new Date('2020-08-02T07:47:28Z'),
        fillId: '5f267c7b545e125452c56e14',
        attributions: [
          {
            appId: '5980a15c-e450-40d3-8ef4-c54a37363ed0',
            relayedTrades: 1,
            totalTrades: 1,
          },
          {
            appId: '449fcf3c-5f05-4cb4-b7bd-cf7c86bd6576',
            sourcedTrades: 1,
            totalTrades: 1,
          },
        ],
      },
    });
  });
});
