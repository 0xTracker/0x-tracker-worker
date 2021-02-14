const mongoose = require('mongoose');
const timekeeper = require('timekeeper');

const { publishJob } = require('../../queues');
const createUniswapV2SwapEventFill = require('.');
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

describe('consumers/create-uniswap-v2-swap-event-fill', () => {
  it('should consume event processing queue', () => {
    expect(createUniswapV2SwapEventFill.queueName).toBe('event-processing');
  });

  it('should consume create-uniswap-v2-swap-event-fill jobs', () => {
    expect(createUniswapV2SwapEventFill.jobName).toBe(
      'create-uniswap-v2-swap-event-fill',
    );
  });

  it('should throw an error when the specified eventId is invalid', async () => {
    const job = { data: { eventId: 'yadda' } };

    expect(createUniswapV2SwapEventFill.fn(job, mockOptions)).rejects.toThrow(
      new Error('Invalid eventId: yadda'),
    );
  });

  it('should throw an error when the specified event does not exist', async () => {
    const job = { data: { eventId: '5f377f6a83c00016fed0d17a' } };

    expect(createUniswapV2SwapEventFill.fn(job, mockOptions)).rejects.toThrow(
      new Error('Cannot find event: 5f377f6a83c00016fed0d17a'),
    );
  });

  it('should reschedule job processing when associated transaction has not been fetched', async () => {
    await Event.create([
      {
        _id: '5f70cb40b8c4ca3f1e6cc17f',
        protocolVersion: 3,
        blockNumber: 10917120,
        data: {
          maker: '0xa478c2975ab1ea89e8196811f51a7b7ade33eb11',
          makerAmount: '34488800000000000000',
          makerToken: '0x6b175474e89094c44da98b954eedeac495271d0f',
          taker: '0x000000f15851d0875e878a83451163999bf5da51',
          takerAmount: '102436482113243119',
          takerToken: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        },
        dateIngested: new Date('2020-09-27T17:26:24.006Z'),
        logIndex: 247,
        transactionHash:
          '0x2394b14050177589fc3177a5073c9e16f9e4d7d6e9905341e12371da188f0b0e',
        type: 'UniswapV2Swap',
      },
    ]);

    const job = { data: { eventId: '5f70cb40b8c4ca3f1e6cc17f' } };

    await createUniswapV2SwapEventFill.fn(job, mockOptions);

    expect(publishJob).toHaveBeenCalledTimes(1);
    expect(publishJob).toHaveBeenCalledWith(
      'event-processing',
      'create-uniswap-v2-swap-event-fill',
      {
        eventId: '5f70cb40b8c4ca3f1e6cc17f',
      },
      {
        delay: 30000,
      },
    );
  });

  it('should log a warning if event was ingested more than five minutes ago and aassociated transaction still not fetched', async () => {
    await Event.create([
      {
        _id: '5f70cb40b8c4ca3f1e6cc17f',
        protocolVersion: 3,
        blockNumber: 10917120,
        data: {
          maker: '0xa478c2975ab1ea89e8196811f51a7b7ade33eb11',
          makerAmount: '34488800000000000000',
          makerToken: '0x6b175474e89094c44da98b954eedeac495271d0f',
          taker: '0x000000f15851d0875e878a83451163999bf5da51',
          takerAmount: '102436482113243119',
          takerToken: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        },
        dateIngested: new Date('2020-09-27T17:26:24.006Z'),
        logIndex: 247,
        transactionHash:
          '0x2394b14050177589fc3177a5073c9e16f9e4d7d6e9905341e12371da188f0b0e',
        type: 'UniswapV2Swap',
      },
    ]);

    timekeeper.freeze('2020-09-27T17:32:24.006Z');

    const job = { data: { eventId: '5f70cb40b8c4ca3f1e6cc17f' } };

    await createUniswapV2SwapEventFill.fn(job, mockOptions);

    expect(mockOptions.logger.warn).toHaveBeenCalledTimes(1);
    expect(mockOptions.logger.warn).toHaveBeenCalledWith(
      'transaction not found for event: 5f70cb40b8c4ca3f1e6cc17f',
    );
  });

  it('should create fill for UniswapV2Swap event', async () => {
    await Event.create([
      {
        _id: '5f70cb40b8c4ca3f1e6cc17f',
        protocolVersion: 3,
        blockNumber: 10917120,
        data: {
          maker: '0xa478c2975ab1ea89e8196811f51a7b7ade33eb11',
          makerAmount: '34488800000000000000',
          makerToken: '0x6b175474e89094c44da98b954eedeac495271d0f',
          taker: '0x000000f15851d0875e878a83451163999bf5da51',
          takerAmount: '102436482113243119',
          takerToken: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        },
        dateIngested: new Date('2020-09-27T17:26:24.006Z'),
        logIndex: 247,
        transactionHash:
          '0x2394b14050177589fc3177a5073c9e16f9e4d7d6e9905341e12371da188f0b0e',
        type: 'UniswapV2Swap',
      },
    ]);

    await Transaction.create({
      _id: '5f723e7c13ed75369ad3af1b',
      affiliateAddress: '0x86003b044f70dac0abc80ac8957305b6370893ed',
      blockHash:
        '0xc96feeadc0e7f575b537469fb38ec749b2f0c35110d8e425c09afd20eff9bece',
      blockNumber: 10917120,
      data:
        '0xd9627aa40000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000001dea0d4ded97e0000000000000000000000000000000000000000000000000000016849c88b1dd35f000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000020000000000000000000000006b175474e89094c44da98b954eedeac495271d0f000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2869584cd00000000000000000000000086003b044f70dac0abc80ac8957305b6370893ed0000000000000000000000000000000000000000000000ec5f7633af5f6ae630',
      date: new Date('2020-09-23T06:07:41.000Z'),
      from: '0x000000f15851d0875e878a83451163999bf5da51',
      gasLimit: 121837,
      gasPrice: '86000000000',
      gasUsed: 103244,
      hash:
        '0x2394b14050177589fc3177a5073c9e16f9e4d7d6e9905341e12371da188f0b0e',
      index: 116,
      nonce: '2014',
      quoteDate: new Date('2020-09-23T06:07:44.000Z'),
      to: '0xdef1c0ded9bec7f1a1670819833240f027b25eff',
      value: '0',
    });

    const job = { data: { eventId: '5f70cb40b8c4ca3f1e6cc17f' } };

    await createUniswapV2SwapEventFill.fn(job, mockOptions);

    const fills = await Fill.find().lean();

    expect(fills).toHaveLength(1);
    expect(fills[0]).toEqual({
      __v: 0,
      _id: mongoose.Types.ObjectId('5f70cb40b8c4ca3f1e6cc17f'),
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
          amount: 34488800000000000000,
          bridgeAddress: '0xdcd6011f4c6b80e470d9487f5871a0cba7c93f48',
          tokenAddress: '0x6b175474e89094c44da98b954eedeac495271d0f',
          tokenResolved: false,
        },
        {
          _id: expect.anything(),
          actor: 1,
          amount: 102436482113243119,
          tokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
          tokenResolved: false,
        },
      ],
      blockHash:
        '0xc96feeadc0e7f575b537469fb38ec749b2f0c35110d8e425c09afd20eff9bece',
      blockNumber: 10917120,
      date: new Date('2020-09-23T06:07:41.000Z'),
      eventId: mongoose.Types.ObjectId('5f70cb40b8c4ca3f1e6cc17f'),
      fees: [],
      hasValue: false,
      immeasurable: false,
      logIndex: 247,
      maker: '0xa478c2975ab1ea89e8196811f51a7b7ade33eb11',
      protocolVersion: 3,
      quoteDate: new Date('2020-09-23T06:07:44.000Z'),
      relayerId: 35,
      status: 1,
      taker: '0x000000f15851d0875e878a83451163999bf5da51',
      transactionHash:
        '0x2394b14050177589fc3177a5073c9e16f9e4d7d6e9905341e12371da188f0b0e',
      type: 2,
    });

    const tokens = await Token.find().lean();

    expect(tokens).toHaveLength(2);
    expect(tokens).toEqual(
      expect.arrayContaining([
        {
          __v: 0,
          _id: expect.anything(),
          address: '0x6b175474e89094c44da98b954eedeac495271d0f',
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
      'created fill for UniswapV2Swap event: 5f70cb40b8c4ca3f1e6cc17f',
    );
  });

  it('should not create fill if it already exists for event', async () => {
    await Event.create([
      {
        _id: '5f70cb40b8c4ca3f1e6cc17f',
        protocolVersion: 3,
        blockNumber: 10917120,
        data: {
          maker: '0xa478c2975ab1ea89e8196811f51a7b7ade33eb11',
          makerAmount: '34488800000000000000',
          makerToken: '0x6b175474e89094c44da98b954eedeac495271d0f',
          taker: '0x000000f15851d0875e878a83451163999bf5da51',
          takerAmount: '102436482113243119',
          takerToken: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        },
        dateIngested: new Date('2020-09-27T17:26:24.006Z'),
        logIndex: 247,
        transactionHash:
          '0x2394b14050177589fc3177a5073c9e16f9e4d7d6e9905341e12371da188f0b0e',
        type: 'UniswapV2Swap',
      },
    ]);

    await Transaction.create({
      _id: '5f723e7c13ed75369ad3af1b',
      affiliateAddress: '0x86003b044f70dac0abc80ac8957305b6370893ed',
      blockHash:
        '0xc96feeadc0e7f575b537469fb38ec749b2f0c35110d8e425c09afd20eff9bece',
      blockNumber: 10917120,
      data:
        '0xd9627aa40000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000001dea0d4ded97e0000000000000000000000000000000000000000000000000000016849c88b1dd35f000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000020000000000000000000000006b175474e89094c44da98b954eedeac495271d0f000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2869584cd00000000000000000000000086003b044f70dac0abc80ac8957305b6370893ed0000000000000000000000000000000000000000000000ec5f7633af5f6ae630',
      date: new Date('2020-09-23T06:07:41.000Z'),
      from: '0x000000f15851d0875e878a83451163999bf5da51',
      gasLimit: 121837,
      gasPrice: '86000000000',
      gasUsed: 103244,
      hash:
        '0x2394b14050177589fc3177a5073c9e16f9e4d7d6e9905341e12371da188f0b0e',
      index: 116,
      nonce: '2014',
      quoteDate: new Date('2020-09-23T06:07:44.000Z'),
      to: '0xdef1c0ded9bec7f1a1670819833240f027b25eff',
      value: '0',
    });

    await Fill.create([
      {
        _id: '5f70cb40b8c4ca3f1e6cc17f',
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
            amount: 34488800000000000000,
            bridgeAddress: '0xdcd6011f4c6b80e470d9487f5871a0cba7c93f48',
            tokenAddress: '0x6b175474e89094c44da98b954eedeac495271d0f',
            tokenResolved: false,
          },
          {
            actor: 1,
            amount: 102436482113243119,
            tokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
            tokenResolved: false,
          },
        ],
        blockHash:
          '0xc96feeadc0e7f575b537469fb38ec749b2f0c35110d8e425c09afd20eff9bece',
        blockNumber: 10917120,
        date: new Date('2020-09-23T06:07:41.000Z'),
        eventId: '5f70cb40b8c4ca3f1e6cc17f',
        fees: [],
        hasValue: false,
        immeasurable: false,
        logIndex: 247,
        maker: '0xa478c2975ab1ea89e8196811f51a7b7ade33eb11',
        protocolVersion: 3,
        quoteDate: new Date('2020-09-23T06:07:44.000Z'),
        relayerId: 35,
        status: 1,
        taker: '0x000000f15851d0875e878a83451163999bf5da51',
        transactionHash:
          '0x2394b14050177589fc3177a5073c9e16f9e4d7d6e9905341e12371da188f0b0e',
        type: 2,
      },
    ]);

    const job = { data: { eventId: '5f70cb40b8c4ca3f1e6cc17f' } };
    await createUniswapV2SwapEventFill.fn(job, mockOptions);
    const fills = await Fill.find().lean();

    expect(fills).toHaveLength(1);
    expect(mockOptions.logger.warn).toHaveBeenCalledTimes(1);
    expect(mockOptions.logger.warn).toHaveBeenCalledWith(
      'fill already created for event: 5f70cb40b8c4ca3f1e6cc17f',
    );
  });
});
