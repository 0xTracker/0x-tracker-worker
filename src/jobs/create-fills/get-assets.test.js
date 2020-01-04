const getAssets = require('./get-assets');

const v1EventArgs = {
  maker: '0x0035fc5208ef989c28d47e552e92b0c507d2b318',
  taker: '0x0e0f53a08d17767e6c07e2e7438f99d6ab331fa1',
  feeRecipient: '0x0000000000000000000000000000000000000000',
  makerToken: '0xe41d2489571d322189246dafa5ebde1f4699f498',
  takerToken: '0x2956356cd2a2bf3202f771f50d3d14a367b48070',
  filledMakerTokenAmount: 3.81909940372739e19,
  filledTakerTokenAmount: 20000000000000000.0,
  paidMakerFee: 0,
  paidTakerFee: 0,
  tokens: '0xba6d84bb63fd28b7ca98ab0edf677fadd1354e572c830880c5ed0a2a0ff0cadb',
  orderHash:
    '0x456517032f248eea8d9fb390c0207f5c1ceec4cca65df4ac36d3f3671f5f3f19',
};

it('should get assets for V1 event args', () => {
  const assets = getAssets(v1EventArgs, 1);

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

it('should return undefined when protocol is not recognised', () => {
  const assets = getAssets(v1EventArgs, 3);

  expect(assets).toBeUndefined();
});

it('should get assets for V2 event with only ERC-20 assets', () => {
  const eventArgs = {
    makerAddress: '0xf6da68519f78b0d0bc93c701e86affcb75c92428',
    feeRecipientAddress: '0xc370d2a5920344aa6b7d8d11250e3e861434cbdd',
    takerAddress: '0xf6da68519f78b0d0bc93c701e86affcb75c92428',
    senderAddress: '0xf6da68519f78b0d0bc93c701e86affcb75c92428',
    makerAssetFilledAmount: 10000000000000000.0,
    takerAssetFilledAmount: 1e18,
    makerFeePaid: 0,
    takerFeePaid: 0,
    orderHash:
      '0x97028d45c7b356db01282bff9c11ccac6dcd73c64474c2a94c2154d3fcd0d343',
    makerAssetData:
      '0xf47261b0000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    takerAssetData:
      '0xf47261b0000000000000000000000000e41d2489571d322189246dafa5ebde1f4699f498',
  };
  const assets = getAssets(eventArgs, 2);

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
  const eventArgs = {
    makerAddress: '0xdcae967431fb51aa7453ec6c06fa544c25e0f1ff',
    feeRecipientAddress: '0xb0d7398d779ee9ffc727d2d5b045a5b441da8233',
    takerAddress: '0x76481caa104b5f6bccb540dae4cefaf1c398ebea',
    senderAddress: '0x76481caa104b5f6bccb540dae4cefaf1c398ebea',
    makerAssetFilledAmount: 1,
    takerAssetFilledAmount: 5000000000000000.0,
    makerFeePaid: 0,
    takerFeePaid: 0,
    orderHash:
      '0x9d67732167403eda67f8e34fa6ebb85f5c1e833c217f6c5ba4694eef8e0f461c',
    makerAssetData:
      '0x02571792000000000000000000000000bdaed67214641b7eda3bf8d7431c3ae5fc46f46600000000000000000000000000000000000000000000000000000000000000a3',
    takerAssetData:
      '0xf47261b0000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  };
  const assets = getAssets(eventArgs, 2);

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
  const eventArgs = {
    makerAddress: '0x9193ed9cbf94d109667c3d5659caffe21b4197bc',
    feeRecipientAddress: '0x0000000000000000000000000000000000000000',
    takerAddress: '0xdf1bc6498338135de5ffdbcb98817d81e2665912',
    senderAddress: '0xdf1bc6498338135de5ffdbcb98817d81e2665912',
    makerAssetFilledAmount: 1,
    takerAssetFilledAmount: 46810278916603824.0,
    makerFeePaid: 0,
    takerFeePaid: 0,
    orderHash:
      '0xc9a69b17a479155016a724a250a6093903bcaafa318e757eab2c7fc6d5ca3edd',
    makerAssetData:
      '0x94cfcdd7000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000078c597355c0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000024f47261b000000000000000000000000009adf3339867a53e5cb4df020cfa2d8a65663d65000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000024f47261b000000000000000000000000007eee91261f846b19853144aa55f06acba0f29b900000000000000000000000000000000000000000000000000000000',
    takerAssetData:
      '0xf47261b000000000000000000000000053b04999c1ff2d77fcdde98935bb936a67209e4c',
  };
  const assets = getAssets(eventArgs, 2);

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
  const eventArgs = {
    makerAddress: '0x9193ed9cbf94d109667c3d5659caffe21b4197bc',
    feeRecipientAddress: '0x0000000000000000000000000000000000000000',
    takerAddress: '0xdf1bc6498338135de5ffdbcb98817d81e2665912',
    senderAddress: '0xdf1bc6498338135de5ffdbcb98817d81e2665912',
    makerAssetFilledAmount: 7597171425070027,
    takerAssetFilledAmount: 46810278916603824.0,
    makerFeePaid: 0,
    takerFeePaid: 0,
    orderHash:
      '0xc9a69b17a479155016a724a250a6093903bcaafa318e757eab2c7fc6d5ca3edd',
    makerAssetData:
      '0xdc1600f3000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc200000000000000000000000058b7b96e170e46c07d02fac903cd1b3356b7549f000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000400000000000000000000000006b175474e89094c44da98b954eedeac495271d0f00000000000000000000000000000000000000000000000000000000000a5a2f',
    takerAssetData:
      '0xf47261b000000000000000000000000053b04999c1ff2d77fcdde98935bb936a67209e4c',
  };
  const assets = getAssets(eventArgs, 2);

  expect(assets).toEqual([
    {
      actor: 0,
      amount: 7597171425070027,
      bridgeAddress: '0x58b7b96e170e46c07d02fac903cd1b3356b7549f',
      bridgeData:
        '0x0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f00000000000000000000000000000000000000000000000000000000000a5a2f',
      bridged: true,
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

it('should return undefined when one of the assets data is corrupt', () => {
  const eventArgs = {
    makerAddress: '0x9193ed9cbf94d109667c3d5659caffe21b4197bc',
    feeRecipientAddress: '0x0000000000000000000000000000000000000000',
    takerAddress: '0xdf1bc6498338135de5ffdbcb98817d81e2665912',
    senderAddress: '0xdf1bc6498338135de5ffdbcb98817d81e2665912',
    makerAssetFilledAmount: 1,
    takerAssetFilledAmount: 46810278916603824.0,
    makerFeePaid: 0,
    takerFeePaid: 0,
    orderHash:
      '0xc9a69b17a479155016a724a250a6093903bcaafa318e757eab2c7fc6d5ca3edd',
    makerAssetData: 'fubar',
    takerAssetData:
      '0xf47261b000000000000000000000000053b04999c1ff2d77fcdde98935bb936a67209e4c',
  };
  const assets = getAssets(eventArgs, 2);

  expect(assets).toBeUndefined();
});
