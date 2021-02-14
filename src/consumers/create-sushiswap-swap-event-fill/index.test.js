const mongoose = require('mongoose');
const timekeeper = require('timekeeper');

const { publishJob } = require('../../queues');
const createSushiswapSwapEventFill = require('.');
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

describe('consumers/create-sushiswap-swap-event-fill', () => {
  it('should consume event processing queue', () => {
    expect(createSushiswapSwapEventFill.queueName).toBe('event-processing');
  });

  it('should consume create-sushiswap-swap-event-fill jobs', () => {
    expect(createSushiswapSwapEventFill.jobName).toBe(
      'create-sushiswap-swap-event-fill',
    );
  });

  it('should throw an error when the specified eventId is invalid', async () => {
    const job = { data: { eventId: 'yadda' } };

    expect(createSushiswapSwapEventFill.fn(job, mockOptions)).rejects.toThrow(
      new Error('Invalid eventId: yadda'),
    );
  });

  it('should throw an error when the specified event does not exist', async () => {
    const job = { data: { eventId: '5f377f6a83c00016fed0d17a' } };

    expect(createSushiswapSwapEventFill.fn(job, mockOptions)).rejects.toThrow(
      new Error('Cannot find event: 5f377f6a83c00016fed0d17a'),
    );
  });

  it('should reschedule job processing when associated transaction has not been fetched', async () => {
    await Event.create([
      {
        _id: '5f74ac562d14a830369657bc',
        protocolVersion: 3,
        blockNumber: 10917501,
        data: {
          maker: '0x397ff1542f962076d0bfe58ea045ffa2d347aca0',
          makerAmount: '566661525',
          makerToken: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          taker: '0xc40d16476380e4037e6b1a2594caf6a6cc8da967',
          takerAmount: '1685636384141005974',
          takerToken: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        },
        dateIngested: new Date('2020-09-30T16:03:34.566Z'),
        logIndex: 338,
        transactionHash:
          '0x10f1684349206b53cdec4f35f1cff6bc7cd7487feba25513633b78e1d8737a46',
        type: 'SushiswapSwap',
      },
    ]);

    const job = { data: { eventId: '5f74ac562d14a830369657bc' } };

    await createSushiswapSwapEventFill.fn(job, mockOptions);

    expect(publishJob).toHaveBeenCalledTimes(1);
    expect(publishJob).toHaveBeenCalledWith(
      'event-processing',
      'create-sushiswap-swap-event-fill',
      {
        eventId: '5f74ac562d14a830369657bc',
      },
      {
        delay: 30000,
      },
    );
  });

  it('should log a warning if event was ingested more than five minutes ago and aassociated transaction still not fetched', async () => {
    await Event.create([
      {
        _id: '5f74ac562d14a830369657bc',
        protocolVersion: 3,
        blockNumber: 10917501,
        data: {
          maker: '0x397ff1542f962076d0bfe58ea045ffa2d347aca0',
          makerAmount: '566661525',
          makerToken: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          taker: '0xc40d16476380e4037e6b1a2594caf6a6cc8da967',
          takerAmount: '1685636384141005974',
          takerToken: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        },
        dateIngested: new Date('2020-09-30T16:03:34.566Z'),
        logIndex: 338,
        transactionHash:
          '0x10f1684349206b53cdec4f35f1cff6bc7cd7487feba25513633b78e1d8737a46',
        type: 'SushiswapSwap',
      },
    ]);

    timekeeper.freeze('2020-09-30T16:09:34.566Z');

    const job = { data: { eventId: '5f74ac562d14a830369657bc' } };

    await createSushiswapSwapEventFill.fn(job, mockOptions);

    expect(mockOptions.logger.warn).toHaveBeenCalledTimes(1);
    expect(mockOptions.logger.warn).toHaveBeenCalledWith(
      'transaction not found for event: 5f74ac562d14a830369657bc',
    );
  });

  it('should create fill for SushiswapSwap event', async () => {
    await Event.create([
      {
        _id: '5f74ac562d14a830369657bc',
        protocolVersion: 3,
        blockNumber: 10917501,
        data: {
          maker: '0x397ff1542f962076d0bfe58ea045ffa2d347aca0',
          makerAmount: '566661525',
          makerToken: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          taker: '0xc40d16476380e4037e6b1a2594caf6a6cc8da967',
          takerAmount: '1685636384141005974',
          takerToken: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        },
        dateIngested: new Date('2020-09-30T16:03:34.566Z'),
        logIndex: 338,
        transactionHash:
          '0x10f1684349206b53cdec4f35f1cff6bc7cd7487feba25513633b78e1d8737a46',
        type: 'SushiswapSwap',
      },
    ]);

    await Transaction.create({
      _id: '5f7b198d9a76d07a3304fedc',
      affiliateAddress: '0x86003b044f70dac0abc80ac8957305b6370893ed',
      blockHash:
        '0xd53aa762cf0ba075298b4ba6be4be70e4b0e1c6b6feb026d8d4ed5c4778d7266',
      blockNumber: 10917501,
      data:
        '0xd9627aa400000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000021c69195000000000000000000000000000000000000000000000003cb71f51fc558000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000003000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000514910771af9ca656af840dff83e8264ecf986ca869584cd00000000000000000000000086003b044f70dac0abc80ac8957305b6370893ed00000000000000000000000000000000000000000000006e617cb5895f6af782',
      date: new Date('2020-09-23T07:27:42.000Z'),
      from: '0x2c3a3f8461fb68ca550fc36ad725a8dd2c841eae',
      gasLimit: 207635,
      gasPrice: '94600000000',
      gasUsed: 175825,
      hash:
        '0x10f1684349206b53cdec4f35f1cff6bc7cd7487feba25513633b78e1d8737a46',
      index: 226,
      nonce: '142',
      quoteDate: new Date('2020-09-23T07:21:38.000Z'),
      to: '0xdef1c0ded9bec7f1a1670819833240f027b25eff',
      value: '0',
    });

    const job = { data: { eventId: '5f74ac562d14a830369657bc' } };

    await createSushiswapSwapEventFill.fn(job, mockOptions);

    const fills = await Fill.find().lean();

    expect(fills).toHaveLength(1);
    expect(fills[0]).toEqual({
      __v: 0,
      _id: mongoose.Types.ObjectId('5f74ac562d14a830369657bc'),
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
          amount: 566661525,
          bridgeAddress: '0x47ed0262a0b688dcb836d254c6a2e96b6c48a9f5',
          tokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          tokenResolved: false,
        },
        {
          _id: expect.anything(),
          actor: 1,
          amount: 1685636384141005974,
          tokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
          tokenResolved: false,
        },
      ],
      blockHash:
        '0xd53aa762cf0ba075298b4ba6be4be70e4b0e1c6b6feb026d8d4ed5c4778d7266',
      blockNumber: 10917501,
      date: new Date('2020-09-23T07:27:42.000Z'),
      eventId: mongoose.Types.ObjectId('5f74ac562d14a830369657bc'),
      fees: [],
      hasValue: false,
      immeasurable: false,
      logIndex: 338,
      maker: '0x397ff1542f962076d0bfe58ea045ffa2d347aca0',
      protocolVersion: 3,
      quoteDate: new Date('2020-09-23T07:21:38.000Z'),
      relayerId: 35,
      status: 1,
      taker: '0xc40d16476380e4037e6b1a2594caf6a6cc8da967',
      transactionHash:
        '0x10f1684349206b53cdec4f35f1cff6bc7cd7487feba25513633b78e1d8737a46',
      type: 3,
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
          address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
          createdAt: expect.anything(),
          resolved: false,
          updatedAt: expect.anything(),
          type: 0,
        },
      ]),
    );

    expect(mockOptions.logger.info).toHaveBeenCalledTimes(1);
    expect(mockOptions.logger.info).toHaveBeenCalledWith(
      'created fill for SushiswapSwap event: 5f74ac562d14a830369657bc',
    );
  });

  it('should not create fill if it already exists for event', async () => {
    await Event.create([
      {
        _id: '5f74ac562d14a830369657bc',
        protocolVersion: 3,
        blockNumber: 10917501,
        data: {
          maker: '0x397ff1542f962076d0bfe58ea045ffa2d347aca0',
          makerAmount: '566661525',
          makerToken: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          taker: '0xc40d16476380e4037e6b1a2594caf6a6cc8da967',
          takerAmount: '1685636384141005974',
          takerToken: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        },
        dateIngested: new Date('2020-09-30T16:03:34.566Z'),
        logIndex: 338,
        transactionHash:
          '0x10f1684349206b53cdec4f35f1cff6bc7cd7487feba25513633b78e1d8737a46',
        type: 'SushiswapSwap',
      },
    ]);

    await Transaction.create({
      _id: '5f7b198d9a76d07a3304fedc',
      affiliateAddress: '0x86003b044f70dac0abc80ac8957305b6370893ed',
      blockHash:
        '0xd53aa762cf0ba075298b4ba6be4be70e4b0e1c6b6feb026d8d4ed5c4778d7266',
      blockNumber: 10917501,
      data:
        '0xd9627aa400000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000021c69195000000000000000000000000000000000000000000000003cb71f51fc558000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000003000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000514910771af9ca656af840dff83e8264ecf986ca869584cd00000000000000000000000086003b044f70dac0abc80ac8957305b6370893ed00000000000000000000000000000000000000000000006e617cb5895f6af782',
      date: new Date('2020-09-23T07:27:42.000Z'),
      from: '0x2c3a3f8461fb68ca550fc36ad725a8dd2c841eae',
      gasLimit: 207635,
      gasPrice: '94600000000',
      gasUsed: 175825,
      hash:
        '0x10f1684349206b53cdec4f35f1cff6bc7cd7487feba25513633b78e1d8737a46',
      index: 226,
      nonce: '142',
      quoteDate: new Date('2020-09-23T07:21:38.000Z'),
      to: '0xdef1c0ded9bec7f1a1670819833240f027b25eff',
      value: '0',
    });

    await Fill.create([
      {
        _id: '5f74ac562d14a830369657bc',
        affiliateAddress: '0x86003b044f70dac0abc80ac8957305b6370893ed',
        attributions: [
          {
            entityId: '5067df8b-f9cd-4a34-aee1-38d607100145',
            type: 1,
          },
        ],
        assets: [
          {
            actor: 0,
            amount: 566661525,
            bridgeAddress: '0x47ed0262a0b688dcb836d254c6a2e96b6c48a9f5',
            tokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            tokenResolved: false,
          },
          {
            actor: 1,
            amount: 1685636384141005974,
            tokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
            tokenResolved: false,
          },
        ],
        blockHash:
          '0xd53aa762cf0ba075298b4ba6be4be70e4b0e1c6b6feb026d8d4ed5c4778d7266',
        blockNumber: 10917501,
        date: new Date('2020-09-23T07:27:42.000Z'),
        eventId: '5f74ac562d14a830369657bc',
        fees: [],
        hasValue: false,
        immeasurable: false,
        logIndex: 338,
        maker: '0x397ff1542f962076d0bfe58ea045ffa2d347aca0',
        protocolVersion: 3,
        quoteDate: new Date('2020-09-23T07:21:38.000Z'),
        relayerId: 35,
        status: 1,
        taker: '0xc40d16476380e4037e6b1a2594caf6a6cc8da967',
        transactionHash:
          '0x10f1684349206b53cdec4f35f1cff6bc7cd7487feba25513633b78e1d8737a46',
        type: 3,
      },
    ]);

    const job = { data: { eventId: '5f74ac562d14a830369657bc' } };
    await createSushiswapSwapEventFill.fn(job, mockOptions);
    const fills = await Fill.find().lean();

    expect(fills).toHaveLength(1);
    expect(mockOptions.logger.warn).toHaveBeenCalledTimes(1);
    expect(mockOptions.logger.warn).toHaveBeenCalledWith(
      'fill already created for event: 5f74ac562d14a830369657bc',
    );
  });
});
