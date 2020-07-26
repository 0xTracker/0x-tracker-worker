const mongoose = require('mongoose');

const model = require('../../model');
const persistFill = require('./persist-fill');
const testUtils = require('../../test-utils');

beforeAll(async () => {
  await testUtils.setupDb();
});

afterAll(() => {
  testUtils.tearDownDb();
});

afterEach(async () => {
  await testUtils.resetDb();
});

const simpleFill = {
  _id: '5bb1f06b62f9ca0004c7cf20',
  apps: [
    {
      appId: '8fc6beb5-3019-45f7-a55a-9a4c6b4b6513',
      type: 0,
    },
  ],
  assets: [
    {
      actor: 0,
      amount: 1,
      tokenAddress: '0xe41d2489571d322189246dafa5ebde1f4699f498',
      tokenResolved: false,
      tokenType: 0,
    },
    {
      actor: 1,
      amount: 1650162000000000,
      tokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      tokenResolved: false,
      tokenType: 0,
    },
  ],
  blockHash:
    '0x592bdb8653f20b291b3cf927314344f299c6e37a3a2887a558b29584d60730d6',
  blockNumber: 6286241,
  date: new Date('2019-10-26T16:32:03.000Z'),
  eventId: '5bb1f06b62f9ca0004c7cf20',
  fees: [
    {
      amount: { token: 500000000000 },
      tokenAddress: '0xe41d2489571d322189246dafa5ebde1f4699f498',
      tokenType: 0,
      traderType: 0,
    },
    {
      amount: { token: 300000000 },
      tokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      tokenType: 0,
      traderType: 1,
    },
  ],
  feeRecipient: '0x173a2467cece1f752eb8416e337d0f0b58cad795',
  logIndex: 42,
  maker: '0xd3d0474124c1013ed6bfcfd9a49cfedb8c78fc44',
  orderHash:
    '0x8739c67a2a559205a7c8c7b24713ec21f35fed8b565a225a998375b1dae1bb14',
  protocolFee: 100000000000,
  protocolVersion: 3,
  relayerId: 15,
  senderAddress: '0xd3d0474124c1013ed6bfcfd9a49cfedb8c78fc44',
  taker: '0x7447dab10325f902725191a34eb8288abe02c7f4',
  transactionHash:
    '0x28ffb48f354997d384eee49d326c13a10c4584ca3bced4632053b201d3a0cbbc',
};

it('should persist fill', async () => {
  await persistFill(undefined, simpleFill);

  const Fill = model.getModel('Fill');
  const fills = await Fill.find();

  expect(fills).toHaveLength(1);
  expect(fills[0].assets).toHaveLength(2);
  expect(fills[0].fees).toHaveLength(2);
  expect(fills[0]).toMatchObject({
    _id: new mongoose.Types.ObjectId('5bb1f06b62f9ca0004c7cf20'),
    assets: expect.arrayContaining([
      expect.objectContaining({
        actor: 0,
        amount: 1,
        tokenAddress: '0xe41d2489571d322189246dafa5ebde1f4699f498',
        tokenResolved: false,
      }),
      expect.objectContaining({
        actor: 1,
        amount: 1650162000000000,
        tokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        tokenResolved: false,
      }),
    ]),
    blockHash:
      '0x592bdb8653f20b291b3cf927314344f299c6e37a3a2887a558b29584d60730d6',
    blockNumber: 6286241,
    date: new Date('2019-10-26T16:32:03.000Z'),
    eventId: new mongoose.Types.ObjectId('5bb1f06b62f9ca0004c7cf20'),
    fees: expect.arrayContaining([
      expect.objectContaining({
        amount: expect.objectContaining({ token: 500000000000 }),
        tokenAddress: '0xe41d2489571d322189246dafa5ebde1f4699f498',
        traderType: 0,
      }),
      expect.objectContaining({
        amount: expect.objectContaining({ token: 300000000 }),
        tokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        traderType: 1,
      }),
    ]),
    feeRecipient: '0x173a2467cece1f752eb8416e337d0f0b58cad795',
    hasValue: false,
    id: '5bb1f06b62f9ca0004c7cf20',
    immeasurable: false,
    logIndex: 42,
    maker: '0xd3d0474124c1013ed6bfcfd9a49cfedb8c78fc44',
    orderHash:
      '0x8739c67a2a559205a7c8c7b24713ec21f35fed8b565a225a998375b1dae1bb14',
    protocolFee: 100000000000,
    protocolVersion: 3,
    relayerId: 15,
    senderAddress: '0xd3d0474124c1013ed6bfcfd9a49cfedb8c78fc44',
    status: 0,
    taker: '0x7447dab10325f902725191a34eb8288abe02c7f4',
    transactionHash:
      '0x28ffb48f354997d384eee49d326c13a10c4584ca3bced4632053b201d3a0cbbc',
  });
});

it('should return new fill with asset and fee tokens populated if they already exist', async () => {
  const Token = model.getModel('Token');

  await Token.create({
    address: '0xe41d2489571d322189246dafa5ebde1f4699f498',
    name: '0x Protocol Token',
    symbol: 'ZRX',
    decimals: 18,
    type: 0,
  });

  await Token.create({
    address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    name: 'Wrapped Ether',
    symbol: 'WETH',
    decimals: 18,
    type: 0,
  });

  const newFill = await persistFill(undefined, simpleFill);

  expect(newFill.assets[0].token).toMatchObject({
    address: '0xe41d2489571d322189246dafa5ebde1f4699f498',
    name: '0x Protocol Token',
    symbol: 'ZRX',
    decimals: 18,
    type: 0,
  });

  expect(newFill.assets[1].token).toMatchObject({
    address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    name: 'Wrapped Ether',
    symbol: 'WETH',
    decimals: 18,
    type: 0,
  });

  expect(newFill.fees[0].token).toMatchObject({
    address: '0xe41d2489571d322189246dafa5ebde1f4699f498',
    name: '0x Protocol Token',
    symbol: 'ZRX',
    decimals: 18,
    type: 0,
  });

  expect(newFill.fees[1].token).toMatchObject({
    address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    name: 'Wrapped Ether',
    symbol: 'WETH',
    decimals: 18,
    type: 0,
  });
});

it('should return new fill with asset and fee tokens unpopulated if they do not exist', async () => {
  const newFill = await persistFill(undefined, simpleFill);

  expect(newFill.assets[0].token).toBeUndefined();
  expect(newFill.assets[1].token).toBeUndefined();
  expect(newFill.fees[0].token).toBeUndefined();
  expect(newFill.fees[1].token).toBeUndefined();
});
