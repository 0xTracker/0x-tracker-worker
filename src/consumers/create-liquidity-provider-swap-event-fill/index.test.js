const mongoose = require('mongoose');
const timekeeper = require('timekeeper');

const { publishJob } = require('../../queues');
const createLiquidityProviderSwapEventFill = require('.');
const Event = require('../../model/event');
const Fill = require('../../model/fill');
const testUtils = require('../../test-utils');
const Token = require('../../model/token');
const Transaction = require('../../model/transaction');

jest.mock('../../queues');

beforeAll(async () => {
  await testUtils.setupDb();
}, 30000);

afterEach(async () => {
  await testUtils.resetDb();
  timekeeper.reset();
  jest.clearAllMocks();
}, 30000);

afterAll(async () => {
  await testUtils.tearDownDb();
}, 30000);

const mockOptions = {
  logger: testUtils.mockLogger,
};

describe('consumers/create-liquidity-provider-swap-event-fill', () => {
  it('should consume fill processing queue', () => {
    expect(createLiquidityProviderSwapEventFill.queueName).toBe(
      'fill-processing',
    );
  });

  it('should consume create-liquidity-provider-swap-event-fill jobs', () => {
    expect(createLiquidityProviderSwapEventFill.jobName).toBe(
      'create-liquidity-provider-swap-event-fill',
    );
  });

  it('should throw an error when the specified eventId is invalid', async () => {
    const job = { data: { eventId: 'yadda' } };

    expect(
      createLiquidityProviderSwapEventFill.fn(job, mockOptions),
    ).rejects.toThrow(new Error('Invalid eventId: yadda'));
  });

  it('should throw an error when the specified event does not exist', async () => {
    const job = { data: { eventId: '5f377f6a83c00016fed0d17a' } };

    expect(
      createLiquidityProviderSwapEventFill.fn(job, mockOptions),
    ).rejects.toThrow(new Error('Cannot find event: 5f377f6a83c00016fed0d17a'));
  });

  it('should reschedule job processing when associated transaction has not been fetched', async () => {
    await Event.create([
      {
        _id: '5fccb51fdc7acd504bd8c2ce',
        protocolVersion: 4,
        blockNumber: 11377458,
        data: {
          inputToken: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          inputTokenAmount: '25000000000',
          outputToken: '0xdac17f958d2ee523a2206206994597c13d831ec7',
          outputTokenAmount: '24985101143',
          provider: '0xc340ef96449514cea4dfa11d847a06d7f03d437c',
          recipient: '0xd2e8f308a4305160fce7bde28865f6b551efcbcc',
        },
        dateIngested: new Date('2020-12-06T10:40:31.188Z'),
        logIndex: 33,
        transactionHash:
          '0xcb75981a2bd35f014b00a97388842477dbc31365ceaa32e96ff19ab8f6d3481c',
        type: 'LiquidityProviderSwap',
        __v: 0,
        scheduler: {
          transactionFetchScheduled: true,
        },
      },
    ]);

    timekeeper.freeze('2020-12-06T10:41:31.188Z');

    const job = { data: { eventId: '5fccb51fdc7acd504bd8c2ce' } };

    await createLiquidityProviderSwapEventFill.fn(job, mockOptions);

    expect(publishJob).toHaveBeenCalledTimes(1);
    expect(publishJob).toHaveBeenCalledWith(
      'fill-processing',
      'create-liquidity-provider-swap-event-fill',
      {
        eventId: '5fccb51fdc7acd504bd8c2ce',
      },
      {
        delay: 30000,
      },
    );
  });

  it('should log a warning if event was ingested more than five minutes ago and aassociated transaction still not fetched', async () => {
    await Event.create([
      {
        _id: '5fccb51fdc7acd504bd8c2ce',
        protocolVersion: 4,
        blockNumber: 11377458,
        data: {
          inputToken: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          inputTokenAmount: '25000000000',
          outputToken: '0xdac17f958d2ee523a2206206994597c13d831ec7',
          outputTokenAmount: '24985101143',
          provider: '0xc340ef96449514cea4dfa11d847a06d7f03d437c',
          recipient: '0xd2e8f308a4305160fce7bde28865f6b551efcbcc',
        },
        dateIngested: new Date('2020-12-06T10:40:31.188Z'),
        logIndex: 33,
        transactionHash:
          '0xcb75981a2bd35f014b00a97388842477dbc31365ceaa32e96ff19ab8f6d3481c',
        type: 'LiquidityProviderSwap',
        __v: 0,
        scheduler: {
          transactionFetchScheduled: true,
        },
      },
    ]);

    timekeeper.freeze('2020-12-06T11:11:31.188Z');

    const job = { data: { eventId: '5fccb51fdc7acd504bd8c2ce' } };

    await createLiquidityProviderSwapEventFill.fn(job, mockOptions);

    expect(mockOptions.logger.warn).toHaveBeenCalledTimes(1);
    expect(mockOptions.logger.warn).toHaveBeenCalledWith(
      'transaction not found for event: 5fccb51fdc7acd504bd8c2ce',
    );
  });

  it('should create fill and tokens for event', async () => {
    await Event.create([
      {
        _id: '5fccb51fdc7acd504bd8c2ce',
        protocolVersion: 4,
        blockNumber: 11377458,
        data: {
          inputToken: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          inputTokenAmount: '25000000000',
          outputToken: '0xdac17f958d2ee523a2206206994597c13d831ec7',
          outputTokenAmount: '24985101143',
          provider: '0xc340ef96449514cea4dfa11d847a06d7f03d437c',
          recipient: '0xd2e8f308a4305160fce7bde28865f6b551efcbcc',
        },
        dateIngested: new Date('2020-12-06T10:40:31.188Z'),
        logIndex: 33,
        transactionHash:
          '0xcb75981a2bd35f014b00a97388842477dbc31365ceaa32e96ff19ab8f6d3481c',
        type: 'LiquidityProviderSwap',
        scheduler: {
          transactionFetchScheduled: true,
        },
      },
    ]);

    await Transaction.create({
      _id: '5fd4d614f37a3e61b9d44add',
      affiliateAddress: '0x86003b044f70dac0abc80ac8957305b6370893ed',
      blockHash:
        '0x2dd6732571ce94d8a91a810566a8d29b8aa75ef5af50b9b1beca4dd546a93560',
      blockNumber: 11377458,
      data:
        '0xf7fcd384000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000000000000000000000000dac17f958d2ee523a2206206994597c13d831ec7000000000000000000000000c340ef96449514cea4dfa11d847a06d7f03d437c000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005d21dba0000000000000000000000000000000000000000000000000000000005c255f6d200000000000000000000000000000000000000000000000000000000000000e00000000000000000000000000000000000000000000000000000000000000000869584cd00000000000000000000000086003b044f70dac0abc80ac8957305b6370893ed00000000000000000000000000000000000000000000004956b631ad5fc869b6',
      date: new Date('2020-12-03T04:29:51.000Z'),
      from: '0xd2e8f308a4305160fce7bde28865f6b551efcbcc',
      gasLimit: 216677,
      gasPrice: '29000000000',
      gasUsed: 194484,
      hash:
        '0xcb75981a2bd35f014b00a97388842477dbc31365ceaa32e96ff19ab8f6d3481c',
      index: 22,
      nonce: '3088',
      quoteDate: new Date('2020-12-03T04:29:42.000Z'),
      to: '0xdef1c0ded9bec7f1a1670819833240f027b25eff',
      value: '0',
    });

    const job = { data: { eventId: '5fccb51fdc7acd504bd8c2ce' } };

    await createLiquidityProviderSwapEventFill.fn(job, mockOptions);

    const newFill = await Fill.findById('5fccb51fdc7acd504bd8c2ce').lean();

    expect(newFill).toEqual({
      __v: 0,
      _id: mongoose.Types.ObjectId('5fccb51fdc7acd504bd8c2ce'),
      affiliateAddress: '0x86003b044f70dac0abc80ac8957305b6370893ed',
      attributions: [
        {
          _id: expect.anything(),
          entityId: '052b4862-2142-4532-bdc0-416814b0a5fe',
          type: 0,
        },
        {
          _id: expect.anything(),
          entityId: '5067df8b-f9cd-4a34-aee1-38d607100145',
          type: 1,
        },
      ],
      assets: [
        {
          _id: expect.anything(),
          actor: 0,
          amount: 25000000000,
          bridgeAddress: '0xc340ef96449514cea4dfa11d847a06d7f03d437c',
          tokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          tokenResolved: false,
        },
        {
          _id: expect.anything(),
          actor: 1,
          amount: 24985101143,
          tokenAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7',
          tokenResolved: false,
        },
      ],
      blockHash:
        '0x2dd6732571ce94d8a91a810566a8d29b8aa75ef5af50b9b1beca4dd546a93560',
      blockNumber: 11377458,
      date: new Date('2020-12-03T04:29:51.000Z'),
      eventId: mongoose.Types.ObjectId('5fccb51fdc7acd504bd8c2ce'),
      fees: [],
      hasValue: false,
      immeasurable: false,
      logIndex: 33,
      maker: '0xc340ef96449514cea4dfa11d847a06d7f03d437c',
      protocolVersion: 3,
      quoteDate: new Date('2020-12-03T04:29:42.000Z'),
      relayerId: 35,
      status: 1,
      taker: '0xd2e8f308a4305160fce7bde28865f6b551efcbcc',
      transactionHash:
        '0xcb75981a2bd35f014b00a97388842477dbc31365ceaa32e96ff19ab8f6d3481c',
      type: 4,
    });

    const tokens = await Token.find().lean();

    expect(tokens).toHaveLength(2);
    expect(tokens).toEqual(
      expect.arrayContaining([
        {
          __v: 0,
          _id: expect.anything(),
          address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          createdAt: expect.anything(),
          resolved: false,
          updatedAt: expect.anything(),
          type: 0,
        },
        {
          __v: 0,
          _id: expect.anything(),
          address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
          createdAt: expect.anything(),
          resolved: false,
          updatedAt: expect.anything(),
          type: 0,
        },
      ]),
    );

    expect(mockOptions.logger.info).toHaveBeenCalledTimes(1);
    expect(mockOptions.logger.info).toHaveBeenCalledWith(
      'created fill for LiquidityProviderSwap event: 5fccb51fdc7acd504bd8c2ce',
    );
  });

  it('should not create fill when it already exists', async () => {
    await Event.create([
      {
        _id: '5fccb51fdc7acd504bd8c2ce',
        protocolVersion: 4,
        blockNumber: 11377458,
        data: {
          inputToken: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          inputTokenAmount: '25000000000',
          outputToken: '0xdac17f958d2ee523a2206206994597c13d831ec7',
          outputTokenAmount: '24985101143',
          provider: '0xc340ef96449514cea4dfa11d847a06d7f03d437c',
          recipient: '0xd2e8f308a4305160fce7bde28865f6b551efcbcc',
        },
        dateIngested: new Date('2020-12-06T10:40:31.188Z'),
        logIndex: 33,
        transactionHash:
          '0xcb75981a2bd35f014b00a97388842477dbc31365ceaa32e96ff19ab8f6d3481c',
        type: 'LiquidityProviderSwap',
        scheduler: {
          transactionFetchScheduled: true,
        },
      },
    ]);

    await Transaction.create({
      _id: '5fd4d614f37a3e61b9d44add',
      affiliateAddress: '0x86003b044f70dac0abc80ac8957305b6370893ed',
      blockHash:
        '0x2dd6732571ce94d8a91a810566a8d29b8aa75ef5af50b9b1beca4dd546a93560',
      blockNumber: 11377458,
      data:
        '0xf7fcd384000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000000000000000000000000dac17f958d2ee523a2206206994597c13d831ec7000000000000000000000000c340ef96449514cea4dfa11d847a06d7f03d437c000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005d21dba0000000000000000000000000000000000000000000000000000000005c255f6d200000000000000000000000000000000000000000000000000000000000000e00000000000000000000000000000000000000000000000000000000000000000869584cd00000000000000000000000086003b044f70dac0abc80ac8957305b6370893ed00000000000000000000000000000000000000000000004956b631ad5fc869b6',
      date: new Date('2020-12-03T04:29:51.000Z'),
      from: '0xd2e8f308a4305160fce7bde28865f6b551efcbcc',
      gasLimit: 216677,
      gasPrice: '29000000000',
      gasUsed: 194484,
      hash:
        '0xcb75981a2bd35f014b00a97388842477dbc31365ceaa32e96ff19ab8f6d3481c',
      index: 22,
      nonce: '3088',
      quoteDate: new Date('2020-12-03T04:29:42.000Z'),
      to: '0xdef1c0ded9bec7f1a1670819833240f027b25eff',
      value: '0',
    });

    await Fill.create([
      {
        _id: '5fccb51fdc7acd504bd8c2ce',
        affiliateAddress: '0x86003b044f70dac0abc80ac8957305b6370893ed',
        attributions: [
          {
            entityId: '052b4862-2142-4532-bdc0-416814b0a5fe',
            type: 0,
          },
          {
            entityId: '5067df8b-f9cd-4a34-aee1-38d607100145',
            type: 1,
          },
        ],
        assets: [
          {
            actor: 0,
            amount: 25000000000,
            bridgeAddress: '0xc340ef96449514cea4dfa11d847a06d7f03d437c',
            tokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            tokenResolved: false,
          },
          {
            actor: 1,
            amount: 24985101143,
            tokenAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7',
            tokenResolved: false,
          },
        ],
        blockHash:
          '0x2dd6732571ce94d8a91a810566a8d29b8aa75ef5af50b9b1beca4dd546a93560',
        blockNumber: 11377458,
        date: new Date('2020-12-03T04:29:51.000Z'),
        eventId: '5fccb51fdc7acd504bd8c2ce',
        fees: [],
        hasValue: false,
        immeasurable: false,
        logIndex: 33,
        maker: '0xc340ef96449514cea4dfa11d847a06d7f03d437c',
        protocolVersion: 3,
        quoteDate: new Date('2020-12-03T04:29:42.000Z'),
        relayerId: 35,
        status: 1,
        taker: '0xd2e8f308a4305160fce7bde28865f6b551efcbcc',
        transactionHash:
          '0xcb75981a2bd35f014b00a97388842477dbc31365ceaa32e96ff19ab8f6d3481c',
        type: 4,
      },
    ]);

    const job = { data: { eventId: '5fccb51fdc7acd504bd8c2ce' } };
    await createLiquidityProviderSwapEventFill.fn(job, mockOptions);
    const fills = await Fill.find().lean();

    expect(fills).toHaveLength(1);
    expect(mockOptions.logger.warn).toHaveBeenCalledWith(
      'fill for LiquidityProviderSwap event already exists: 5fccb51fdc7acd504bd8c2ce',
    );
  });
});
