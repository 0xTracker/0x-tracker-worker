const { publishJob } = require('../queues');
const createNewTokens = require('./create-new-tokens');
const getExistingTokens = require('./get-existing-tokens');
const testUtils = require('../test-utils');
const Token = require('../model/token');

jest.mock('../queues');
jest.mock('./get-existing-tokens');

beforeAll(async () => {
  await testUtils.setupDb();
}, 30000);

beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(async () => {
  await testUtils.resetDb();
}, 30000);

afterAll(async () => {
  await testUtils.tearDownDb();
}, 30000);

it('should create no tokens when no tokens specified', async () => {
  await createNewTokens([]);

  expect(publishJob).toHaveBeenCalledTimes(0);

  const tokens = await Token.find().lean();

  expect(tokens).toHaveLength(0);
});

it('should create all tokens when they are all new', async () => {
  getExistingTokens.mockResolvedValueOnce([]);

  await createNewTokens([
    { address: '0x123', type: 0 },
    { address: '0x567', type: 1 },
  ]);

  expect(publishJob).toHaveBeenCalledTimes(2);
  expect(publishJob).toHaveBeenCalledWith(
    'token-processing',
    'fetch-token-metadata',
    { tokenAddress: '0x123', tokenType: 0 },
    { delay: 30000, jobId: 'fetch-token-metadata-0x123' },
  );
  expect(publishJob).toHaveBeenCalledWith(
    'token-processing',
    'fetch-token-metadata',
    { tokenAddress: '0x567', tokenType: 1 },
    { delay: 30000, jobId: 'fetch-token-metadata-0x567' },
  );

  const tokens = await Token.find().lean();

  expect(tokens).toHaveLength(2);
  expect(tokens).toEqual(
    expect.arrayContaining([
      {
        _id: expect.anything(),
        __v: 0,
        address: '0x123',
        createdAt: expect.anything(),
        resolved: false,
        type: 0,
        updatedAt: expect.anything(),
      },
      {
        _id: expect.anything(),
        __v: 0,
        address: '0x567',
        createdAt: expect.anything(),
        resolved: false,
        type: 1,
        updatedAt: expect.anything(),
      },
    ]),
  );
});

it('should not create any new tokens when all tokens exist', async () => {
  // TODO: Get rid of this mock
  getExistingTokens.mockResolvedValueOnce(['0x123', '0x567']);

  await createNewTokens([
    { address: '0x123', type: 0 },
    { address: '0x567', type: 1 },
  ]);

  expect(publishJob).toHaveBeenCalledTimes(0);

  const tokens = await Token.find().lean();
  expect(tokens).toHaveLength(0);
});

it('should create new tokens when some tokens already exist', async () => {
  // TODO: Get rid of this mock
  getExistingTokens.mockResolvedValueOnce(['0x567']);

  await createNewTokens([
    { address: '0x123', type: 0 },
    { address: '0x567', type: 1 },
  ]);

  expect(publishJob).toHaveBeenCalledTimes(1);
  expect(publishJob).toHaveBeenCalledWith(
    'token-processing',
    'fetch-token-metadata',
    { tokenAddress: '0x123', tokenType: 0 },
    { delay: 30000, jobId: 'fetch-token-metadata-0x123' },
  );

  const tokens = await Token.find().lean();

  expect(tokens).toHaveLength(1);
  expect(tokens).toEqual(
    expect.arrayContaining([
      {
        _id: expect.anything(),
        __v: 0,
        address: '0x123',
        createdAt: expect.anything(),
        resolved: false,
        type: 0,
        updatedAt: expect.anything(),
      },
    ]),
  );
});
