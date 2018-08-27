const ercDEXRecipientCache = require('./erc-dex/recipient-cache');
const getAllRelayers = require('./get-all-relayers');

jest.mock('./erc-dex/recipient-cache');

beforeEach(() => {
  jest.resetAllMocks();
});

it('should return all relayers', () => {
  ercDEXRecipientCache.getRecipients.mockReturnValueOnce([
    'fred',
    'flintstone',
  ]);

  const relayers = getAllRelayers();

  expect(relayers).toMatchSnapshot();
});

it('should return ERC dEX with cached fee recipients', () => {
  ercDEXRecipientCache.getRecipients.mockReturnValueOnce(['foo', 'bar']);

  const relayers = getAllRelayers();

  expect(relayers.ercDex.feeRecipients).toEqual(['foo', 'bar']);
});
