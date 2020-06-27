const { publishJob } = require('../queues');
const createNewTokens = require('./create-new-tokens');
const getExistingTokens = require('./get-existing-tokens');

jest.mock('../queues');
jest.mock('./get-existing-tokens');

beforeEach(() => {
  jest.resetAllMocks();
});

it('should publish no jobs when no tokens specified', async () => {
  await createNewTokens([]);

  expect(publishJob).toHaveBeenCalledTimes(0);
});

it('should publish jobs for tokens when they are all new', async () => {
  getExistingTokens.mockResolvedValueOnce([]);

  await createNewTokens([
    { address: '0x123', type: 0 },
    { address: '0x567', type: 1 },
  ]);

  expect(publishJob).toHaveBeenCalledTimes(2);
  expect(publishJob).toHaveBeenNthCalledWith(
    1,
    'token-processing',
    'create-token',
    { tokenAddress: '0x123', tokenType: 0 },
    { jobId: 'create-token-0x123' },
  );
  expect(publishJob).toHaveBeenNthCalledWith(
    2,
    'token-processing',
    'create-token',
    { tokenAddress: '0x567', tokenType: 1 },
    { jobId: 'create-token-0x567' },
  );
});

it('should not publish jobs when all tokens exist', async () => {
  getExistingTokens.mockResolvedValueOnce(['0x123', '0x567']);

  await createNewTokens([
    { address: '0x123', type: 0 },
    { address: '0x567', type: 1 },
  ]);

  expect(publishJob).toHaveBeenCalledTimes(0);
});

it('should publish some jobs when some tokens already exist', async () => {
  getExistingTokens.mockResolvedValueOnce(['0x567']);

  await createNewTokens([
    { address: '0x123', type: 0 },
    { address: '0x567', type: 1 },
  ]);

  expect(publishJob).toHaveBeenCalledTimes(1);
  expect(publishJob).toHaveBeenNthCalledWith(
    1,
    'token-processing',
    'create-token',
    { tokenAddress: '0x123', tokenType: 0 },
    { jobId: 'create-token-0x123' },
  );
});
