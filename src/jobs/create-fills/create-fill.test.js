const createFill = require('./create-fill');
const getBlock = require('../../util/ethereum/get-block');
const MissingBlockError = require('../../errors/missing-block-error');
const V1_EVENT = require('../../fixtures/events/v1');
const V2_EVENT = require('../../fixtures/events/v2');
const V3_EVENT = require('../../fixtures/events/v3');

jest.mock('../../util/ethereum/get-block');

describe('createFill', () => {
  it('should throw MissingBlockError when block does not exist', async () => {
    getBlock.mockResolvedValue(null);

    await expect(createFill(V1_EVENT)).rejects.toThrow(new MissingBlockError());
  });

  it('should create fill for v1 event', async () => {
    getBlock.mockResolvedValue({ timestamp: 1572107523 });
    const fill = await createFill(V1_EVENT);

    expect(fill).toEqual({
      assets: [
        {
          actor: 0,
          amount: 51120414914765620,
          tokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
          tokenResolved: false,
          tokenType: 0,
        },
        {
          actor: 1,
          amount: 1.5e21,
          tokenAddress: '0xd0a4b8946cb52f0661273bfbc6fd0e0c75fc6433',
          tokenResolved: false,
          tokenType: 0,
        },
      ],
      blockHash:
        '0xd383bf2c68bfd74d777857fc066390d1f18934cd8ad57a967b5a8049ff8bd479',
      blockNumber: 6062314,
      conversions: {
        USD: { makerFee: 0, takerFee: 0 },
      },
      date: new Date('2019-10-26T16:32:03.000Z'),
      eventId: '5b602b3cfd9c10000491443c',
      fees: undefined,
      feeRecipient: '0xa258b39954cef5cb142fd567a46cddb31a670124',
      logIndex: 101,
      maker: '0x91eb6d8ae94e6c8a16acce49f8c2e07d6d690d19',
      makerFee: 0,
      orderHash:
        '0x939bcf22efbea1acd6732821dcdf2f6308e170e6f617e665143fa3e89575237e',
      protocolFee: undefined,
      protocolVersion: 1,
      relayerId: 7,
      senderAddress: undefined,
      taker: '0x98ac18627bf2205a816eee7fbc919a7db83a4908',
      takerFee: 0,
      transactionHash:
        '0x00cfc187cce6c5f537f84621b6fce4ac828848f2b088b16f0deeb4bde2586637',
    });
  });

  it('should create fill for v2 event', async () => {
    getBlock.mockResolvedValue({ timestamp: 1572107523 });
    const fill = await createFill(V2_EVENT);

    expect(fill).toEqual({
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
      conversions: {
        USD: { makerFee: 0, takerFee: 0 },
      },
      date: new Date('2019-10-26T16:32:03.000Z'),
      eventId: '5bb1f06b62f9ca0004c7cf20',
      fees: undefined,
      feeRecipient: '0x173a2467cece1f752eb8416e337d0f0b58cad795',
      logIndex: 42,
      maker: '0xd3d0474124c1013ed6bfcfd9a49cfedb8c78fc44',
      makerFee: 0,
      orderHash:
        '0x8739c67a2a559205a7c8c7b24713ec21f35fed8b565a225a998375b1dae1bb14',
      protocolFee: undefined,
      protocolVersion: 2,
      relayerId: undefined,
      senderAddress: '0xd3d0474124c1013ed6bfcfd9a49cfedb8c78fc44',
      taker: '0x7447dab10325f902725191a34eb8288abe02c7f4',
      takerFee: 0,
      transactionHash:
        '0x28ffb48f354997d384eee49d326c13a10c4584ca3bced4632053b201d3a0cbbc',
    });
  });

  it('should create fill for v3 event', async () => {
    getBlock.mockResolvedValue({ timestamp: 1572107523 });
    const fill = await createFill(V3_EVENT);

    expect(fill).toEqual({
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
      conversions: {
        USD: { makerFee: 0, takerFee: 0 },
      },
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
      makerFee: undefined,
      orderHash:
        '0x8739c67a2a559205a7c8c7b24713ec21f35fed8b565a225a998375b1dae1bb14',
      protocolFee: 100000000000,
      protocolVersion: 3,
      relayerId: undefined,
      senderAddress: '0xd3d0474124c1013ed6bfcfd9a49cfedb8c78fc44',
      taker: '0x7447dab10325f902725191a34eb8288abe02c7f4',
      takerFee: undefined,
      transactionHash:
        '0x28ffb48f354997d384eee49d326c13a10c4584ca3bced4632053b201d3a0cbbc',
    });
  });
});
