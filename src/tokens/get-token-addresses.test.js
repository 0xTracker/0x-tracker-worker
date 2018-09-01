const { getTokens } = require('./token-cache');
const getTokenAddresses = require('./get-token-addresses');

jest.mock('./token-cache');

beforeAll(() => {
  getTokens.mockReturnValue([
    { address: '0x123', symbol: 'GNT' },
    { address: '0x09876', symbol: 'WETH' },
    { address: '0x6789', symbol: 'WETH' },
    { address: '0x546389', symbol: 'DAI' },
  ]);
});

it('should return addresses for specified tokens', () => {
  const addresses = getTokenAddresses(['DAI', 'WETH']);

  expect(addresses).toEqual(['0x09876', '0x6789', '0x546389']);
});

it('should return empty array when no tokens with matching symbols', () => {
  const addresses = getTokenAddresses(['ZRX', 'OMG']);

  expect(addresses).toEqual([]);
});
