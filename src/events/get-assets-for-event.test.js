const { UnsupportedAssetError } = require('../errors');
const getAssetsForEvent = require('./get-assets-for-event');
const V1_EVENT = require('../fixtures/events/v1');
const V2_EVENT = require('../fixtures/events/v2');

const eventWithArgs = (event, args) => ({
  ...event,
  data: {
    ...event.data,
    args: {
      ...event.args,
      ...args,
    },
  },
});

it('should get assets for V1 event args', () => {
  const event = eventWithArgs(V1_EVENT, {
    makerToken: '0xe41d2489571d322189246dafa5ebde1f4699f498',
    takerToken: '0x2956356cd2a2bf3202f771f50d3d14a367b48070',
    filledMakerTokenAmount: 3.81909940372739e19,
    filledTakerTokenAmount: 20000000000000000.0,
  });
  const assets = getAssetsForEvent(event);

  expect(assets).toEqual([
    {
      actor: 0,
      amount: 38190994037273900000,
      tokenAddress: '0xe41d2489571d322189246dafa5ebde1f4699f498',
      tokenResolved: false,
      tokenType: 0,
    },
    {
      actor: 1,
      amount: 20000000000000000,
      tokenAddress: '0x2956356cd2a2bf3202f771f50d3d14a367b48070',
      tokenResolved: false,
      tokenType: 0,
    },
  ]);
});

it('should get assets for V2 event with only ERC-20 assets', () => {
  const event = eventWithArgs(V2_EVENT, {
    makerAssetFilledAmount: 10000000000000000.0,
    takerAssetFilledAmount: 1e18,
    makerAssetData:
      '0xf47261b0000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    takerAssetData:
      '0xf47261b0000000000000000000000000e41d2489571d322189246dafa5ebde1f4699f498',
  });
  const assets = getAssetsForEvent(event);

  expect(assets).toEqual([
    {
      actor: 0,
      amount: 10000000000000000,
      tokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      tokenResolved: false,
      tokenType: 0,
    },
    {
      actor: 1,
      amount: 1000000000000000000,
      tokenAddress: '0xe41d2489571d322189246dafa5ebde1f4699f498',
      tokenResolved: false,
      tokenType: 0,
    },
  ]);
});

it('should get assets for V2 event with mixed assets', () => {
  const event = eventWithArgs(V2_EVENT, {
    makerAssetFilledAmount: 1,
    takerAssetFilledAmount: 5000000000000000.0,
    makerAssetData:
      '0x02571792000000000000000000000000bdaed67214641b7eda3bf8d7431c3ae5fc46f46600000000000000000000000000000000000000000000000000000000000000a3',
    takerAssetData:
      '0xf47261b0000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  });
  const assets = getAssetsForEvent(event);

  expect(assets).toEqual([
    {
      actor: 0,
      amount: 1,
      tokenAddress: '0xbdaed67214641b7eda3bf8d7431c3ae5fc46f466',
      tokenId: 163,
      tokenResolved: false,
      tokenType: 1,
    },
    {
      actor: 1,
      amount: 5000000000000000,
      tokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      tokenResolved: false,
      tokenType: 0,
    },
  ]);
});

it('should get assets for V2 event with multi-asset data', () => {
  const event = eventWithArgs(V2_EVENT, {
    makerAssetFilledAmount: 1,
    takerAssetFilledAmount: 46810278916603824.0,
    makerAssetData:
      '0x94cfcdd7000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000078c597355c0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000024f47261b000000000000000000000000009adf3339867a53e5cb4df020cfa2d8a65663d65000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000024f47261b000000000000000000000000007eee91261f846b19853144aa55f06acba0f29b900000000000000000000000000000000000000000000000000000000',
    takerAssetData:
      '0xf47261b000000000000000000000000053b04999c1ff2d77fcdde98935bb936a67209e4c',
  });
  const assets = getAssetsForEvent(event);

  expect(assets).toEqual([
    {
      actor: 0,
      amount: 0,
      tokenAddress: '0x09adf3339867a53e5cb4df020cfa2d8a65663d65',
      tokenResolved: false,
      tokenType: 0,
    },
    {
      actor: 0,
      amount: 518711096668,
      tokenAddress: '0x07eee91261f846b19853144aa55f06acba0f29b9',
      tokenResolved: false,
      tokenType: 0,
    },
    {
      actor: 1,
      amount: 46810278916603820,
      tokenAddress: '0x53b04999c1ff2d77fcdde98935bb936a67209e4c',
      tokenResolved: false,
      tokenType: 0,
    },
  ]);
});

it('should get assets for V2 event with bridged ERC20 asset data', () => {
  const event = eventWithArgs(V2_EVENT, {
    makerAssetFilledAmount: 7597171425070027,
    takerAssetFilledAmount: 46810278916603824.0,
    makerAssetData:
      '0xdc1600f3000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc200000000000000000000000058b7b96e170e46c07d02fac903cd1b3356b7549f000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000400000000000000000000000006b175474e89094c44da98b954eedeac495271d0f00000000000000000000000000000000000000000000000000000000000a5a2f',
    takerAssetData:
      '0xf47261b000000000000000000000000053b04999c1ff2d77fcdde98935bb936a67209e4c',
  });
  const assets = getAssetsForEvent(event);

  expect(assets).toEqual([
    {
      actor: 0,
      amount: 7597171425070027,
      bridgeAddress: '0x58b7b96e170e46c07d02fac903cd1b3356b7549f',
      bridgeData:
        '0x0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f00000000000000000000000000000000000000000000000000000000000a5a2f',
      tokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      tokenResolved: false,
      tokenType: 0,
    },
    {
      actor: 1,
      amount: 46810278916603820,
      tokenAddress: '0x53b04999c1ff2d77fcdde98935bb936a67209e4c',
      tokenResolved: false,
      tokenType: 0,
    },
  ]);
});

it('should throw UnsupportedAssetError when one of the assets data is corrupt', () => {
  const event = eventWithArgs(V2_EVENT, {
    makerAssetData: 'fubar',
  });
  expect(() => {
    getAssetsForEvent(event);
  }).toThrow(UnsupportedAssetError);
});

it('should get assets for event with ERC-1155 asset data', () => {
  const event = eventWithArgs(V2_EVENT, {
    makerAssetData:
      '0xf47261b0000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    takerAssetData:
      '0xa7cb5fb7000000000000000000000000d4690a51044db77d91d7aa8f7a3a5ad5da331af0000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000e000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000e3a2a1f2146d86a604adc220b4967a898d7fe0700000000000000000000000009a379ef7218bcfd8913faa8b281ebc5a2e0bc0400000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000013b0000000000000000000000000000000000000000000000000000000000000004',
    makerAssetFilledAmount: 70000000000000000.0,
    takerAssetFilledAmount: 1,
  });
  const assets = getAssetsForEvent(event);

  expect(assets).toEqual([
    {
      actor: 0,
      amount: 70000000000000000,
      tokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      tokenResolved: false,
      tokenType: 0,
    },
    {
      actor: 1,
      amount: 1,
      tokenAddress: '0xd4690a51044db77d91d7aa8f7a3a5ad5da331af0',
      tokenId: undefined,
      tokenResolved: false,
      tokenType: 2,
    },
  ]);
});
