const timekeeper = require('timekeeper');

const { getModels } = require('../model');
const { mockLogger } = require('../test-utils');
const { publishJob } = require('../queues');
const consumer = require('./create-token');
const testUtils = require('../test-utils');

jest.mock('../queues');

const createToken = consumer.fn;
const mockOptions = {
  logger: mockLogger,
};

beforeAll(async () => {
  await testUtils.setupDb();
}, 30000);

afterEach(async () => {
  jest.resetAllMocks();
  await testUtils.resetDb();
}, 30000);

afterAll(async () => {
  await testUtils.tearDownDb();
}, 30000);

describe('consumers.createToken', () => {
  it('should subscribe to token-processing queue and consume create-token jobs', () => {
    expect(consumer.queueName).toBe('token-processing');
    expect(consumer.jobName).toBe('create-token');
  });

  it('should throw an error when tokenAddress missing from job data', async () => {
    await expect(
      createToken({ data: { tokenType: 0 } }, mockOptions),
    ).rejects.toThrow(new Error('Job data is missing tokenAddress'));
  });

  it('should throw an error when tokenType is invalid', async () => {
    await expect(
      createToken(
        { data: { tokenAddress: '0xabc', tokenType: 101 } },
        mockOptions,
      ),
    ).rejects.toThrow(new Error('Invalid tokenType: 101'));
  });

  it('should create token if it does not already exist', async () => {
    timekeeper.freeze('2020-06-17T15:18:22.000Z');

    const newToken = await createToken(
      {
        data: { tokenAddress: '0xabc', tokenType: 0 },
      },
      mockOptions,
    );

    expect(newToken).toMatchObject({
      address: '0xabc',
      createdAt: new Date('2020-06-17T15:18:22.000Z'),
      updatedAt: new Date('2020-06-17T15:18:22.000Z'),
      resolved: false,
      type: 0,
    });

    timekeeper.reset();
  });

  it('should not create token if it already exists', async () => {
    const { Token } = getModels();
    await Token.create({ address: '0xabc', type: 0 });
    const newToken = await createToken(
      {
        data: { tokenAddress: '0xabc', tokenType: 0 },
      },
      mockOptions,
    );
    expect(newToken).toBeUndefined();
  });

  it('should fetch token metadata after 30 seconds if new token was created', async () => {
    await createToken(
      {
        data: { tokenAddress: '0xabc', tokenType: 0 },
      },
      mockOptions,
    );

    expect(publishJob).toHaveBeenCalledTimes(1);
    expect(publishJob).toHaveBeenNthCalledWith(
      1,
      'token-processing',
      'fetch-token-metadata',
      {
        tokenAddress: '0xabc',
        tokenType: 0,
      },
      { delay: 30000, jobId: 'fetch-token-metadata-0xabc' },
    );
  });
});
