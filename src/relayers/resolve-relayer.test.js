const resolveRelayer = require('./resolve-relayer');

it('should return null when no relayer matched', () => {
  const metadata = {
    feeRecipient: '0xe269e891a2ec8585a378882ffa531141205e92e9',
    takerAddress: '0x5dd835a893734b8d556eccf87800b76dda5aedc5',
  };
  const relayer = resolveRelayer(metadata);

  expect(relayer).toBeNull();
});

it('should return DDEX when taker address matches', () => {
  const metadata = {
    takerAddress: '0xe269e891a2ec8585a378882ffa531141205e92e9',
  };
  const relayer = resolveRelayer(metadata);

  expect(relayer).toMatchSnapshot();
});

it('should return Bamboo Relay when fee recipient matches', () => {
  const metadata = {
    feeRecipient: '0x5dd835a893734b8d556eccf87800b76dda5aedc5',
  };
  const relayer = resolveRelayer(metadata);

  expect(relayer).toMatchSnapshot();
});

it('should return Gods Unchained when sender address matches', () => {
  const metadata = {
    senderAddress: '0xb04239b53806ab31141e6cd47c63fb3480cac908',
  };
  const relayer = resolveRelayer(metadata);

  expect(relayer.name).toBe('Gods Unchained');
});

it('should return Matcha when affiliate address is 0x86003b044f70dac0abc80ac8957305b6370893ed and no other relayer matches', () => {
  const metadata = {
    affiliateAddress: '0x86003b044f70dac0abc80ac8957305b6370893ed',
    feeRecipient: '0xe269e891a2ec8585a378882ffa531141205e92e9',
    takerAddress: '0x5dd835a893734b8d556eccf87800b76dda5aedc5',
  };
  const relayer = resolveRelayer(metadata);

  expect(relayer.name).toBe('Matcha');
});

it('should return SwitchDex when affiliate address matches Matcha but fee recipient matches SwitchDex', () => {
  const metadata = {
    affiliateAddress: '0x86003b044f70dac0abc80ac8957305b6370893ed',
    feeRecipient: '0x10aa8c82e3656170baae80d189b8b7dcea6865c9',
  };
  const relayer = resolveRelayer(metadata);

  expect(relayer.name).toBe('SwitchDex');
});

it('should return Matcha when fee recipient is 0x86003b044f70dac0abc80ac8957305b6370893ed', () => {
  const metadata = {
    feeRecipient: '0x86003b044f70dac0abc80ac8957305b6370893ed',
  };
  const relayer = resolveRelayer(metadata);

  expect(relayer.name).toBe('Matcha');
});

it('should return Matcha when fee recipient is 0x API but affiliate address matches Matcha', () => {
  const metadata = {
    affiliateAddress: '0x86003b044f70dac0abc80ac8957305b6370893ed',
    feeRecipient: '0x1000000000000000000000000000000000000011',
  };
  const relayer = resolveRelayer(metadata);

  expect(relayer.name).toBe('Matcha');
});
