const mongoose = require('mongoose');

const { getModel } = require('../../model');
const { publishJob } = require('../../queues');
const createFill = require('./create-fill');
const getExistingTokens = require('../../tokens/get-existing-tokens');
const testUtils = require('../../test-utils');
const V1_EVENT = require('../../fixtures/events/v1');
const V2_EVENT = require('../../fixtures/events/v2');
const V3_EVENT = require('../../fixtures/events/v3');

jest.mock('../../tokens/get-existing-tokens');
jest.mock('../../queues');

const simpleTransaction = {
  blockHash:
    '0xd383bf2c68bfd74d777857fc066390d1f18934cd8ad57a967b5a8049ff8bd479',
  blockNumber: 6062314,
  date: new Date(1572107523 * 1000),
  hash: '0x00cfc187cce6c5f537f84621b6fce4ac828848f2b088b16f0deeb4bde2586637',
};

beforeAll(async () => {
  await testUtils.setupDb();
}, 30000);

beforeEach(() => {
  getExistingTokens.mockResolvedValue([]);
});

afterEach(async () => {
  await testUtils.resetDb();
  jest.resetAllMocks();
}, 30000);

afterAll(async () => {
  await testUtils.tearDownDb();
}, 30000);

describe('createFill', () => {
  it('should persist fill for v1 event', async () => {
    await createFill(V1_EVENT, simpleTransaction);

    const Fill = getModel('Fill');
    const fill = await Fill.findById(V1_EVENT._id).lean();

    expect(fill).toEqual({
      __v: 0,
      _id: mongoose.Types.ObjectId('5b602b3cfd9c10000491443c'),
      assets: [
        {
          _id: expect.anything(),
          actor: 0,
          amount: 51120414914765620,
          tokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
          tokenResolved: false,
        },
        {
          _id: expect.anything(),
          actor: 1,
          amount: 1.5e21,
          tokenAddress: '0xd0a4b8946cb52f0661273bfbc6fd0e0c75fc6433',
          tokenResolved: false,
        },
      ],
      attributions: [
        {
          _id: expect.anything(),
          entityId: '048f757c-42b5-4403-86da-5a298cac8c04',
          type: 0,
        },
      ],
      blockHash:
        '0xd383bf2c68bfd74d777857fc066390d1f18934cd8ad57a967b5a8049ff8bd479',
      blockNumber: 6062314,
      date: new Date('2019-10-26T16:32:03.000Z'),
      eventId: mongoose.Types.ObjectId('5b602b3cfd9c10000491443c'),
      fees: [
        {
          _id: expect.anything(),
          amount: {
            token: 1200000000000000000,
          },
          tokenAddress: '0xe41d2489571d322189246dafa5ebde1f4699f498',
          traderType: 0,
        },
        {
          _id: expect.anything(),
          amount: {
            token: 2300000000000000000,
          },
          tokenAddress: '0xe41d2489571d322189246dafa5ebde1f4699f498',
          traderType: 1,
        },
      ],
      feeRecipient: '0xa258b39954cef5cb142fd567a46cddb31a670124',
      hasValue: false,
      immeasurable: false,
      logIndex: 101,
      maker: '0x91eb6d8ae94e6c8a16acce49f8c2e07d6d690d19',
      orderHash:
        '0x939bcf22efbea1acd6732821dcdf2f6308e170e6f617e665143fa3e89575237e',
      protocolVersion: 1,
      relayerId: 7,
      status: 1,
      taker: '0x98ac18627bf2205a816eee7fbc919a7db83a4908',
      transactionHash:
        '0x00cfc187cce6c5f537f84621b6fce4ac828848f2b088b16f0deeb4bde2586637',
      type: 0,
    });

    // Ensure fill indexing job is published with 30 second delay
    expect(publishJob).toHaveBeenCalledWith(
      'fill-indexing',
      'index-fill',
      {
        fillId: '5b602b3cfd9c10000491443c',
      },
      {
        delay: 30000,
        jobId: `index-fill-5b602b3cfd9c10000491443c`,
      },
    );

    // Ensure protocol fee conversion job not published
    expect(publishJob).not.toHaveBeenCalledWith(
      'fill-processing',
      'convert-protocol-fee',
      {
        fillId: '5bb1f06b62f9ca0004c7cf20',
        fillDate: new Date('2019-10-26T16:32:03.000Z'),
        protocolFee: undefined,
      },
      {
        delay: 30000,
        jobId: `convert-protocol-fee-5bb1f06b62f9ca0004c7cf20`,
      },
    );

    // Ensure traded token indexing job is published
    expect(publishJob).toHaveBeenCalledWith(
      'traded-token-indexing',
      'index-traded-tokens',
      {
        attributions: [
          {
            id: '048f757c-42b5-4403-86da-5a298cac8c04',
            type: 0,
          },
        ],
        date: new Date('2019-10-26T16:32:03.000Z'),
        fillId: '5b602b3cfd9c10000491443c',
        relayerId: 7,
        tradedTokens: [
          {
            address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
            tradeCountContribution: 1,
            type: 0,
          },
          {
            address: '0xd0a4b8946cb52f0661273bfbc6fd0e0c75fc6433',
            tradeCountContribution: 1,
            type: 0,
          },
        ],
      },
      {
        jobId: `index-traded-tokens-5b602b3cfd9c10000491443c`,
      },
    );

    /*
     * Ensure all the associated tokens are created when they don't already exist
     */
    const tokens = await getModel('Token')
      .find()
      .lean();

    expect(tokens).toEqual(
      expect.arrayContaining([
        {
          __v: 0,
          _id: expect.anything(),
          address: '0xd0a4b8946cb52f0661273bfbc6fd0e0c75fc6433',
          createdAt: expect.anything(),
          resolved: false,
          type: 0,
          updatedAt: expect.anything(),
        },
        {
          __v: 0,
          _id: expect.anything(),
          address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
          createdAt: expect.anything(),
          resolved: false,
          type: 0,
          updatedAt: expect.anything(),
        },
        {
          __v: 0,
          _id: expect.anything(),
          address: '0xe41d2489571d322189246dafa5ebde1f4699f498',
          createdAt: expect.anything(),
          resolved: false,
          type: 0,
          updatedAt: expect.anything(),
        },
      ]),
    );
  }, 60000);

  it('should persist fill for v2 event', async () => {
    await createFill(V2_EVENT, {
      ...simpleTransaction,
      blockHash:
        '0x592bdb8653f20b291b3cf927314344f299c6e37a3a2887a558b29584d60730d6',
      blockNumber: 6286241,
      hash:
        '0x28ffb48f354997d384eee49d326c13a10c4584ca3bced4632053b201d3a0cbbc',
    });

    const Fill = getModel('Fill');
    const fill = await Fill.findById(V2_EVENT._id).lean();

    expect(fill).toEqual({
      __v: 0,
      _id: mongoose.Types.ObjectId('5bb1f06b62f9ca0004c7cf20'),
      attributions: [],
      assets: [
        {
          _id: expect.anything(),
          actor: 0,
          amount: 1,
          tokenAddress: '0xe41d2489571d322189246dafa5ebde1f4699f498',
          tokenResolved: false,
        },
        {
          _id: expect.anything(),
          actor: 1,
          amount: 1650162000000000,
          tokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
          tokenResolved: false,
        },
      ],
      blockHash:
        '0x592bdb8653f20b291b3cf927314344f299c6e37a3a2887a558b29584d60730d6',
      blockNumber: 6286241,
      date: new Date('2019-10-26T16:32:03.000Z'),
      eventId: mongoose.Types.ObjectId('5bb1f06b62f9ca0004c7cf20'),
      fees: [
        {
          _id: expect.anything(),
          amount: { token: 1200000000000000000 },
          tokenAddress: '0xe41d2489571d322189246dafa5ebde1f4699f498',
          traderType: 0,
        },
        {
          _id: expect.anything(),
          amount: { token: 2800000000000000000 },
          tokenAddress: '0xe41d2489571d322189246dafa5ebde1f4699f498',
          traderType: 1,
        },
      ],
      feeRecipient: '0x173a2467cece1f752eb8416e337d0f0b58cad795',
      hasValue: false,
      immeasurable: false,
      logIndex: 42,
      maker: '0xd3d0474124c1013ed6bfcfd9a49cfedb8c78fc44',
      orderHash:
        '0x8739c67a2a559205a7c8c7b24713ec21f35fed8b565a225a998375b1dae1bb14',
      protocolVersion: 2,
      senderAddress: '0xd3d0474124c1013ed6bfcfd9a49cfedb8c78fc44',
      status: 1,
      taker: '0x7447dab10325f902725191a34eb8288abe02c7f4',
      transactionHash:
        '0x28ffb48f354997d384eee49d326c13a10c4584ca3bced4632053b201d3a0cbbc',
      type: 0,
    });
  }, 60000);

  it('should persist fill for v3 event', async () => {
    await createFill(V3_EVENT, {
      ...simpleTransaction,
      affiliateAddress: '0x000000056',
      blockHash:
        '0x592bdb8653f20b291b3cf927314344f299c6e37a3a2887a558b29584d60730d6',
      blockNumber: 6286241,
      hash:
        '0x28ffb48f354997d384eee49d326c13a10c4584ca3bced4632053b201d3a0cbbc',
      quoteDate: new Date('2019-11-15T03:48:09.000Z'),
    });

    const Fill = getModel('Fill');
    const fill = await Fill.findById(V3_EVENT._id).lean();

    expect(fill).toEqual({
      __v: 0,
      _id: mongoose.Types.ObjectId('5bb1f06b62f9ca0004c7cf20'),
      affiliateAddress: '0x000000056',
      attributions: [],
      assets: [
        {
          _id: expect.anything(),
          actor: 0,
          amount: 1,
          tokenAddress: '0xe41d2489571d322189246dafa5ebde1f4699f498',
          tokenResolved: false,
        },
        {
          _id: expect.anything(),
          actor: 1,
          amount: 1650162000000000,
          tokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
          tokenResolved: false,
        },
      ],
      blockHash:
        '0x592bdb8653f20b291b3cf927314344f299c6e37a3a2887a558b29584d60730d6',
      blockNumber: 6286241,
      date: new Date('2019-10-26T16:32:03.000Z'),
      eventId: mongoose.Types.ObjectId('5bb1f06b62f9ca0004c7cf20'),
      fees: [
        {
          _id: expect.anything(),
          amount: { token: 500000000000 },
          tokenAddress: '0xe41d2489571d322189246dafa5ebde1f4699f498',
          traderType: 0,
        },
        {
          _id: expect.anything(),
          amount: { token: 300000000 },
          tokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
          traderType: 1,
        },
      ],
      feeRecipient: '0x173a2467cece1f752eb8416e337d0f0b58cad795',
      hasValue: false,
      immeasurable: false,
      logIndex: 42,
      maker: '0xd3d0474124c1013ed6bfcfd9a49cfedb8c78fc44',
      orderHash:
        '0x8739c67a2a559205a7c8c7b24713ec21f35fed8b565a225a998375b1dae1bb14',
      protocolFee: 100000000000,
      protocolVersion: 3,
      quoteDate: new Date('2019-11-15T03:48:09.000Z'),
      senderAddress: '0xe33c8e3a0d14a81f0dd7e174830089e82f65fc85',
      status: 1,
      taker: '0x7447dab10325f902725191a34eb8288abe02c7f4',
      transactionHash:
        '0x28ffb48f354997d384eee49d326c13a10c4584ca3bced4632053b201d3a0cbbc',
      type: 0,
    });

    // Ensure protocol fee conversion job is published
    expect(publishJob).toHaveBeenCalledWith(
      'fill-processing',
      'convert-protocol-fee',
      {
        fillId: '5bb1f06b62f9ca0004c7cf20',
        fillDate: new Date('2019-10-26T16:32:03.000Z'),
        protocolFee: 100000000000,
      },
      {
        delay: 30000,
        jobId: `convert-protocol-fee-5bb1f06b62f9ca0004c7cf20`,
      },
    );

    // Ensure relayer fee conversion job is published with 30 second delay
    expect(publishJob).toHaveBeenCalledWith(
      'fill-processing',
      'convert-relayer-fees',
      {
        fillId: '5bb1f06b62f9ca0004c7cf20',
      },
      {
        delay: 30000,
        jobId: `convert-relayer-fees-5bb1f06b62f9ca0004c7cf20`,
      },
    );
  }, 60000);

  it('should fetch associated address types when unknown', async () => {
    await createFill(V3_EVENT, {
      ...simpleTransaction,
      affiliateAddress: '0x86003b044f70dac0abc80ac8957305b6370893ed',
    });

    // Fee Recipient
    expect(publishJob).toHaveBeenCalledWith(
      'address-processing',
      'fetch-address-type',
      {
        address: '0x173a2467cece1f752eb8416e337d0f0b58cad795',
      },
      {
        jobId: 'fetch-address-type-0x173a2467cece1f752eb8416e337d0f0b58cad795',
      },
    );

    // Maker
    expect(publishJob).toHaveBeenCalledWith(
      'address-processing',
      'fetch-address-type',
      {
        address: '0xd3d0474124c1013ed6bfcfd9a49cfedb8c78fc44',
      },
      {
        jobId: 'fetch-address-type-0xd3d0474124c1013ed6bfcfd9a49cfedb8c78fc44',
      },
    );

    // Taker
    expect(publishJob).toHaveBeenCalledWith(
      'address-processing',
      'fetch-address-type',
      {
        address: '0x7447dab10325f902725191a34eb8288abe02c7f4',
      },
      {
        jobId: 'fetch-address-type-0x7447dab10325f902725191a34eb8288abe02c7f4',
      },
    );

    // Sender
    expect(publishJob).toHaveBeenCalledWith(
      'address-processing',
      'fetch-address-type',
      {
        address: '0xe33c8e3a0d14a81f0dd7e174830089e82f65fc85',
      },
      {
        jobId: 'fetch-address-type-0xe33c8e3a0d14a81f0dd7e174830089e82f65fc85',
      },
    );

    // Sender
    expect(publishJob).toHaveBeenCalledWith(
      'address-processing',
      'fetch-address-type',
      {
        address: '0x86003b044f70dac0abc80ac8957305b6370893ed',
      },
      {
        jobId: 'fetch-address-type-0x86003b044f70dac0abc80ac8957305b6370893ed',
      },
    );
  });

  it('should index fill traders after creation', async () => {
    await createFill(V3_EVENT, simpleTransaction);

    expect(publishJob).toHaveBeenCalledWith('indexing', 'index-fill-traders', {
      appIds: [],
      fillDate: new Date('2019-10-26T16:32:03.000Z'),
      fillId: '5bb1f06b62f9ca0004c7cf20',
      maker: '0xd3d0474124c1013ed6bfcfd9a49cfedb8c78fc44',
      taker: '0x7447dab10325f902725191a34eb8288abe02c7f4',
      tradeCount: 1,
      transactionHash:
        '0x00cfc187cce6c5f537f84621b6fce4ac828848f2b088b16f0deeb4bde2586637',
    });
  });

  // TODO: Reintroduce these tests in a future PR
  // it('should only create tokens which do not already exist', async () => {
  //   getExistingTokens.mockResolvedValue([
  //     '0xd0a4b8946cb52f0661273bfbc6fd0e0c75fc6433',
  //   ]);

  //   await createFill(V1_EVENT, simpleTransaction);

  //   // Maker token
  //   expect(publishJob).toHaveBeenCalledWith(
  //     'token-processing',
  //     'create-token',
  //     {
  //       tokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  //       tokenType: 0,
  //     },
  //     {
  //       jobId: `create-token-0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2`,
  //     },
  //   );

  //   // ZRX for fees
  //   expect(publishJob).toHaveBeenCalledWith(
  //     'token-processing',
  //     'create-token',
  //     {
  //       tokenAddress: '0xe41d2489571d322189246dafa5ebde1f4699f498',
  //       tokenType: 0,
  //     },
  //     {
  //       jobId: `create-token-0xe41d2489571d322189246dafa5ebde1f4699f498`,
  //     },
  //   );
  // });

  // it('should not create new tokens when they already exist', async () => {
  //   getExistingTokens.mockResolvedValue([
  //     '0xd0a4b8946cb52f0661273bfbc6fd0e0c75fc6433',
  //     '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  //     '0xe41d2489571d322189246dafa5ebde1f4699f498',
  //   ]);

  //   await createFill(V1_EVENT, simpleTransaction);

  //   // Taker token
  //   expect(publishJob).not.toHaveBeenCalledWith(
  //     'token-processing',
  //     'create-token',
  //     {
  //       tokenAddress: '0xd0a4b8946cb52f0661273bfbc6fd0e0c75fc6433',
  //       tokenType: 0,
  //     },
  //     {
  //       jobId: `create-token-0xd0a4b8946cb52f0661273bfbc6fd0e0c75fc6433`,
  //     },
  //   );

  //   // Maker token
  //   expect(publishJob).not.toHaveBeenCalledWith(
  //     'token-processing',
  //     'create-token',
  //     {
  //       tokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  //       tokenType: 0,
  //     },
  //     {
  //       jobId: `create-token-0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2`,
  //     },
  //   );

  //   // ZRX for fees
  //   expect(publishJob).not.toHaveBeenCalledWith(
  //     'token-processing',
  //     'create-token',
  //     {
  //       tokenAddress: '0xe41d2489571d322189246dafa5ebde1f4699f498',
  //       tokenType: 0,
  //     },
  //     {
  //       jobId: `create-token-0xe41d2489571d322189246dafa5ebde1f4699f498`,
  //     },
  //   );
  // });

  // it('should populate attributions when they match definitions', async () => {
  //   await createFill(
  //     {
  //       ...V3_EVENT,
  //       data: {
  //         ...V3_EVENT.data,
  //         args: {
  //           ...V3_EVENT.data.args,
  //           feeRecipientAddress: '0x4d37f28d2db99e8d35a6c725a5f1749a085850a3',
  //         },
  //       },
  //     },
  //     {
  //       ...simpleTransaction,
  //       affiliateAddress: '0x86003b044f70dac0abc80ac8957305b6370893ed',
  //     },
  //   );

  //   expect(persistFill.mock.calls[0][1].attributions).toEqual([
  //     {
  //       entityId: '8fc6beb5-3019-45f7-a55a-9a4c6b4b6513',
  //       type: 0,
  //     },
  //     {
  //       entityId: '5067df8b-f9cd-4a34-aee1-38d607100145',
  //       type: 1,
  //     },
  //   ]);
  // });
});
