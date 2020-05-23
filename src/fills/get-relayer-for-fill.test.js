const getRelayerForFill = require('./get-relayer-for-fill');

it('should return null when no relayer matched', () => {
  const fill = {
    feeRecipient: '0xe269e891a2ec8585a378882ffa531141205e92e9',
    takerAddress: '0x5dd835a893734b8d556eccf87800b76dda5aedc5',
  };
  const relayer = getRelayerForFill(fill);

  expect(relayer).toBeNull();
});

it('should return DDEX when taker address matches', () => {
  const fill = { takerAddress: '0xe269e891a2ec8585a378882ffa531141205e92e9' };
  const relayer = getRelayerForFill(fill);

  expect(relayer).toMatchSnapshot();
});

it('should return Bamboo Relay when fee recipient matches', () => {
  const fill = { feeRecipient: '0x5dd835a893734b8d556eccf87800b76dda5aedc5' };
  const relayer = getRelayerForFill(fill);

  expect(relayer).toMatchSnapshot();
});

it('should return Gods Unchained when sender address matches', () => {
  const fill = { senderAddress: '0xb04239b53806ab31141e6cd47c63fb3480cac908' };
  const relayer = getRelayerForFill(fill);

  expect(relayer.name).toBe('Gods Unchained');
});
