const mongoose = require('mongoose');
const timekeeper = require('timekeeper');

const { publishJob } = require('../../queues');
const createFillsForEvent = require('.');
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

describe('consumers/create-fills-for-event', () => {
  it('should consume event processing queue', () => {
    expect(createFillsForEvent.queueName).toBe('event-processing');
  });

  it('should consume create-fills-for-event jobs', () => {
    expect(createFillsForEvent.jobName).toBe('create-fills-for-event');
  });

  it('should throw an error when the specified eventId is invalid', async () => {
    const job = { data: { eventId: 'yadda' } };

    expect(createFillsForEvent.fn(job, mockOptions)).rejects.toThrow(
      new Error('Invalid eventId: yadda'),
    );
  });

  it('should throw an error when the specified event does not exist', async () => {
    const job = { data: { eventId: '5f377f6a83c00016fed0d17a' } };

    expect(createFillsForEvent.fn(job, mockOptions)).rejects.toThrow(
      new Error('Cannot find event: 5f377f6a83c00016fed0d17a'),
    );
  });

  it('should reschedule job processing when associated transaction has not been fetched', async () => {
    await Event.create([
      {
        _id: '600e7823b1592424e2dadcc8',
        protocolVersion: 4,
        blockNumber: 11598722,
        data: {
          feeRecipient: '0xccd070b1f16072af4963457f3e914d11943b8d07',
          maker: '0xccd070b1f16072af4963457f3e914d11943b8d07',
          makerToken: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
          makerTokenFilledAmount: '1',
          orderHash:
            '0xc4821dcc1075df043e3ef71d46d7ab33c7c7d61e4311af024fbc5d79e5273933',
          pool:
            '0x0000000000000000000000000000000000000000000000000000000000000000',
          protocolFeePaid: '8400000000000000',
          taker: '0x9016cc2122b52ff5d9937c0c1422b78d7e81ceea',
          takerToken: '0x6b175474e89094c44da98b954eedeac495271d0f',
          takerTokenFeeFilledAmount: '0',
          takerTokenFilledAmount: '1',
        },
        dateIngested: new Date('2021-01-25T07:49:55.368Z'),
        logIndex: 31,
        transactionHash:
          '0x87b06f51b6e14c9edc26f9af246bc7b4ba3d82ae7b61597dda772a0a6547f934',
        type: 'LimitOrderFilled',
      },
    ]);

    const job = { data: { eventId: '600e7823b1592424e2dadcc8' } };

    await createFillsForEvent.fn(job, mockOptions);

    expect(publishJob).toHaveBeenCalledTimes(1);
    expect(publishJob).toHaveBeenCalledWith(
      'event-processing',
      'create-fills-for-event',
      {
        eventId: '600e7823b1592424e2dadcc8',
      },
      {
        delay: 30000,
      },
    );
  });

  it('should log a warning if event was ingested more than five minutes ago and aassociated transaction still not fetched', async () => {
    await Event.create([
      {
        _id: '600e7823b1592424e2dadcc8',
        protocolVersion: 4,
        blockNumber: 11598722,
        data: {
          feeRecipient: '0xccd070b1f16072af4963457f3e914d11943b8d07',
          maker: '0xccd070b1f16072af4963457f3e914d11943b8d07',
          makerToken: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
          makerTokenFilledAmount: '1',
          orderHash:
            '0xc4821dcc1075df043e3ef71d46d7ab33c7c7d61e4311af024fbc5d79e5273933',
          pool:
            '0x0000000000000000000000000000000000000000000000000000000000000000',
          protocolFeePaid: '8400000000000000',
          taker: '0x9016cc2122b52ff5d9937c0c1422b78d7e81ceea',
          takerToken: '0x6b175474e89094c44da98b954eedeac495271d0f',
          takerTokenFeeFilledAmount: '0',
          takerTokenFilledAmount: '1',
        },
        dateIngested: new Date('2021-01-25T07:49:55.368Z'),
        logIndex: 31,
        transactionHash:
          '0x87b06f51b6e14c9edc26f9af246bc7b4ba3d82ae7b61597dda772a0a6547f934',
        type: 'LimitOrderFilled',
      },
    ]);

    timekeeper.freeze('2021-01-25T07:59:55.368Z');

    const job = { data: { eventId: '600e7823b1592424e2dadcc8' } };

    await createFillsForEvent.fn(job, mockOptions);

    expect(mockOptions.logger.warn).toHaveBeenCalledTimes(1);
    expect(mockOptions.logger.warn).toHaveBeenCalledWith(
      'transaction not found for event: 600e7823b1592424e2dadcc8',
    );
  });

  it('should create fill for LimitOrderFilled event', async () => {
    await Event.create([
      {
        _id: '600e7823b1592424e2dadcc8',
        protocolVersion: 4,
        blockNumber: 11598722,
        data: {
          feeRecipient: '0xccd070b1f16072af4963457f3e914d11943b8d07',
          maker: '0xccd070b1f16072af4963457f3e914d11943b8d07',
          makerToken: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
          makerTokenFilledAmount: '1',
          orderHash:
            '0xc4821dcc1075df043e3ef71d46d7ab33c7c7d61e4311af024fbc5d79e5273933',
          pool:
            '0x0000000000000000000000000000000000000000000000000000000000000000',
          protocolFeePaid: '8400000000000000',
          taker: '0x9016cc2122b52ff5d9937c0c1422b78d7e81ceea',
          takerToken: '0x6b175474e89094c44da98b954eedeac495271d0f',
          takerTokenFeeFilledAmount: '1',
          takerTokenFilledAmount: '5',
        },
        dateIngested: new Date('2021-01-25T07:49:55.368Z'),
        logIndex: 31,
        transactionHash:
          '0x87b06f51b6e14c9edc26f9af246bc7b4ba3d82ae7b61597dda772a0a6547f934',
        type: 'LimitOrderFilled',
      },
    ]);

    await Transaction.create({
      _id: '601eb2ca2cfb457ba927c6b9',
      blockHash:
        '0xf918b590c5e3c53cb8f8070bde038fab7339406967e7f2b0c2f06dd647c8410d',
      blockNumber: 11598722,
      data:
        '0xf6274f66000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000000000000000000000006b175474e89094c44da98b954eedeac495271d0f000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000ccd070b1f16072af4963457f3e914d11943b8d070000000000000000000000009016cc2122b52ff5d9937c0c1422b78d7e81ceea0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000ccd070b1f16072af4963457f3e914d11943b8d070000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000009184e729fff00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000001c65f38ea745ea383ce0d783323db6dc2a1eb89db39f85886e27d10426f6519a0970590215ab061af6d9f356e0916d305c7a9773f443dc8457eaffb6d4aebab1480000000000000000000000000000000000000000000000000000000000000001',
      date: new Date('2021-01-06T04:02:19.000Z'),
      from: '0x9016cc2122b52ff5d9937c0c1422b78d7e81ceea',
      gasLimit: 200000,
      gasPrice: '120000000000',
      gasUsed: 161695,
      hash:
        '0x87b06f51b6e14c9edc26f9af246bc7b4ba3d82ae7b61597dda772a0a6547f934',
      index: 23,
      nonce: '198',
      to: '0xdef1c0ded9bec7f1a1670819833240f027b25eff',
      value: '8400000000000000',
    });

    const job = { data: { eventId: '600e7823b1592424e2dadcc8' } };

    await createFillsForEvent.fn(job, mockOptions);

    const fills = await Fill.find().lean();

    expect(fills).toHaveLength(1);
    expect(fills[0]).toEqual({
      __v: 0,
      _id: mongoose.Types.ObjectId('600e7823b1592424e2dadcc8'),
      attributions: [],
      assets: [
        {
          _id: expect.anything(),
          actor: 0,
          amount: 1,
          tokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
          tokenResolved: false,
        },
        {
          _id: expect.anything(),
          actor: 1,
          amount: 5,
          tokenAddress: '0x6b175474e89094c44da98b954eedeac495271d0f',
          tokenResolved: false,
        },
      ],
      blockHash:
        '0xf918b590c5e3c53cb8f8070bde038fab7339406967e7f2b0c2f06dd647c8410d',
      blockNumber: 11598722,
      date: new Date('2021-01-06T04:02:19.000Z'),
      eventId: mongoose.Types.ObjectId('600e7823b1592424e2dadcc8'),
      fees: [
        {
          _id: expect.anything(),
          amount: { token: 1 },
          tokenAddress: '0x6b175474e89094c44da98b954eedeac495271d0f',
          traderType: 1,
        },
      ],
      feeRecipient: '0xccd070b1f16072af4963457f3e914d11943b8d07',
      hasValue: false,
      immeasurable: false,
      logIndex: 31,
      maker: '0xccd070b1f16072af4963457f3e914d11943b8d07',
      orderHash:
        '0xc4821dcc1075df043e3ef71d46d7ab33c7c7d61e4311af024fbc5d79e5273933',
      pool:
        '0x0000000000000000000000000000000000000000000000000000000000000000',
      protocolFee: 8400000000000000,
      protocolVersion: 4,
      status: 1,
      taker: '0x9016cc2122b52ff5d9937c0c1422b78d7e81ceea',
      transactionHash:
        '0x87b06f51b6e14c9edc26f9af246bc7b4ba3d82ae7b61597dda772a0a6547f934',
      type: 5,
    });

    const tokens = await Token.find().lean();

    expect(tokens).toHaveLength(2);
    expect(tokens).toEqual(
      expect.arrayContaining([
        {
          __v: 0,
          _id: expect.anything(),
          address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
          createdAt: expect.anything(),
          resolved: false,
          updatedAt: expect.anything(),
          type: 0,
        },
        {
          __v: 0,
          _id: expect.anything(),
          address: '0x6b175474e89094c44da98b954eedeac495271d0f',
          createdAt: expect.anything(),
          resolved: false,
          updatedAt: expect.anything(),
          type: 0,
        },
      ]),
    );

    expect(mockOptions.logger.info).toHaveBeenCalledTimes(1);
    expect(mockOptions.logger.info).toHaveBeenCalledWith(
      'created fill for LimitOrderFilled event: 600e7823b1592424e2dadcc8',
    );
  });

  it('should not create fill if it already exists for LimitOrderFilled event', async () => {
    await Event.create([
      {
        _id: '600e7823b1592424e2dadcc8',
        protocolVersion: 4,
        blockNumber: 11598722,
        data: {
          feeRecipient: '0xccd070b1f16072af4963457f3e914d11943b8d07',
          maker: '0xccd070b1f16072af4963457f3e914d11943b8d07',
          makerToken: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
          makerTokenFilledAmount: '1',
          orderHash:
            '0xc4821dcc1075df043e3ef71d46d7ab33c7c7d61e4311af024fbc5d79e5273933',
          pool:
            '0x0000000000000000000000000000000000000000000000000000000000000000',
          protocolFeePaid: '8400000000000000',
          taker: '0x9016cc2122b52ff5d9937c0c1422b78d7e81ceea',
          takerToken: '0x6b175474e89094c44da98b954eedeac495271d0f',
          takerTokenFeeFilledAmount: '0',
          takerTokenFilledAmount: '1',
        },
        dateIngested: new Date('2021-01-25T07:49:55.368Z'),
        logIndex: 31,
        transactionHash:
          '0x87b06f51b6e14c9edc26f9af246bc7b4ba3d82ae7b61597dda772a0a6547f934',
        type: 'LimitOrderFilled',
      },
    ]);

    await Transaction.create({
      _id: '601eb2ca2cfb457ba927c6b9',
      blockHash:
        '0xf918b590c5e3c53cb8f8070bde038fab7339406967e7f2b0c2f06dd647c8410d',
      blockNumber: 11598722,
      data:
        '0xf6274f66000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000000000000000000000006b175474e89094c44da98b954eedeac495271d0f000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000ccd070b1f16072af4963457f3e914d11943b8d070000000000000000000000009016cc2122b52ff5d9937c0c1422b78d7e81ceea0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000ccd070b1f16072af4963457f3e914d11943b8d070000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000009184e729fff00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000001c65f38ea745ea383ce0d783323db6dc2a1eb89db39f85886e27d10426f6519a0970590215ab061af6d9f356e0916d305c7a9773f443dc8457eaffb6d4aebab1480000000000000000000000000000000000000000000000000000000000000001',
      date: new Date('2021-01-06T04:02:19.000Z'),
      from: '0x9016cc2122b52ff5d9937c0c1422b78d7e81ceea',
      gasLimit: 200000,
      gasPrice: '120000000000',
      gasUsed: 161695,
      hash:
        '0x87b06f51b6e14c9edc26f9af246bc7b4ba3d82ae7b61597dda772a0a6547f934',
      index: 23,
      nonce: '198',
      to: '0xdef1c0ded9bec7f1a1670819833240f027b25eff',
      value: '8400000000000000',
    });

    await Fill.create([
      {
        _id: '600e7823b1592424e2dadcc8',
        attributions: [],
        assets: [
          {
            actor: 0,
            amount: 1,
            tokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
            tokenResolved: false,
          },
          {
            actor: 1,
            amount: 1,
            tokenAddress: '0x6b175474e89094c44da98b954eedeac495271d0f',
            tokenResolved: false,
          },
        ],
        blockHash:
          '0xf918b590c5e3c53cb8f8070bde038fab7339406967e7f2b0c2f06dd647c8410d',
        blockNumber: 11598722,
        date: new Date('2021-01-06T04:02:19.000Z'),
        eventId: '600e7823b1592424e2dadcc8',
        fees: [],
        feeRecipient: '0xccd070b1f16072af4963457f3e914d11943b8d07',
        hasValue: false,
        immeasurable: false,
        logIndex: 31,
        maker: '0xccd070b1f16072af4963457f3e914d11943b8d07',
        orderHash:
          '0xc4821dcc1075df043e3ef71d46d7ab33c7c7d61e4311af024fbc5d79e5273933',
        pool:
          '0x0000000000000000000000000000000000000000000000000000000000000000',
        protocolFee: 8400000000000000,
        protocolVersion: 4,
        status: 1,
        taker: '0x9016cc2122b52ff5d9937c0c1422b78d7e81ceea',
        transactionHash:
          '0x87b06f51b6e14c9edc26f9af246bc7b4ba3d82ae7b61597dda772a0a6547f934',
        type: 5,
      },
    ]);

    const job = { data: { eventId: '600e7823b1592424e2dadcc8' } };
    await createFillsForEvent.fn(job, mockOptions);
    const fills = await Fill.find().lean();

    expect(fills).toHaveLength(1);
    expect(mockOptions.logger.warn).toHaveBeenCalledTimes(1);
    expect(mockOptions.logger.warn).toHaveBeenCalledWith(
      'fill for LimitOrderFilled event already exists: 600e7823b1592424e2dadcc8',
    );
  });

  it('should create fill for RfqOrderFilled event', async () => {
    await Event.create([
      {
        _id: '600e7acbb1592424e2dadd73',
        protocolVersion: 4,
        blockNumber: 11609845,
        data: {
          maker: '0xca77dc47eec9e1c46c9f541ba0f222e741d6236b',
          makerToken: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          makerTokenFilledAmount: '5320',
          orderHash:
            '0xf8174cbb0ed8fb158bb0e775c325fc81e4a260f23384382119c220a078068d2a',
          pool:
            '0x0000000000000000000000000000000000000000000000000000000000000017',
          taker: '0x975eac3e6da5281d00844b251cd146b9621ef824',
          takerToken: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
          takerTokenFilledAmount: '10000000000000',
        },
        dateIngested: new Date('2021-01-25T08:01:15.872Z'),
        logIndex: 52,
        transactionHash:
          '0x57247fbc2207d298bd161ccf4bdd37545c0baf3f92cb65ad82f25083577a07b1',
        type: 'RfqOrderFilled',
        __v: 0,
        scheduler: {
          transactionFetchScheduled: true,
        },
      },
    ]);

    await Transaction.create({
      _id: '601eb2ca2cfb457ba927c6bd',
      blockHash:
        '0xd5c5b303f9e457afb48c9028c3bc318b8781634a4ea9f1ca37850ad8db3a453c',
      blockNumber: 11609845,
      data:
        '0x438cdfc5000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000000000000000000000000000000000000ee6b2800000000000000000000000000000000000000000000000000685701b9b2e1000000000000000000000000000ca77dc47eec9e1c46c9f541ba0f222e741d6236b000000000000000000000000975eac3e6da5281d00844b251cd146b9621ef824000000000000000000000000975eac3e6da5281d00844b251cd146b9621ef8240000000000000000000000000000000000000000000000000000000000000017000000000000000000000000000000000000000000000000000000005ff779fe00000000000000000000000000000000000000000000000000000176dea545f00000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000001bf86b983c81619c0350a083c8a81ca016b46d272a8c4204326fee4db6a88b1dc53755305b0fa4437844da78d83d5d852c0801a74b4da678b30842d1b955535c42000000000000000000000000000000000000000000000000000009184e72a000',
      date: new Date('2021-01-07T21:07:11.000Z'),
      from: '0x975eac3e6da5281d00844b251cd146b9621ef824',
      gasLimit: 126869,
      gasPrice: '100000100000',
      gasUsed: 125496,
      hash:
        '0x57247fbc2207d298bd161ccf4bdd37545c0baf3f92cb65ad82f25083577a07b1',
      index: 30,
      nonce: '161',
      to: '0xdef1c0ded9bec7f1a1670819833240f027b25eff',
      value: '0',
    });

    const job = { data: { eventId: '600e7acbb1592424e2dadd73' } };

    await createFillsForEvent.fn(job, mockOptions);

    const fills = await Fill.find().lean();

    expect(fills).toHaveLength(1);
    expect(fills[0]).toEqual({
      __v: 0,
      _id: mongoose.Types.ObjectId('600e7acbb1592424e2dadd73'),
      attributions: [],
      assets: [
        {
          _id: expect.anything(),
          actor: 0,
          amount: 5320,
          tokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          tokenResolved: false,
        },
        {
          _id: expect.anything(),
          actor: 1,
          amount: 10000000000000,
          tokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
          tokenResolved: false,
        },
      ],
      blockHash:
        '0xd5c5b303f9e457afb48c9028c3bc318b8781634a4ea9f1ca37850ad8db3a453c',
      blockNumber: 11609845,
      date: new Date('2021-01-07T21:07:11.000Z'),
      eventId: mongoose.Types.ObjectId('600e7acbb1592424e2dadd73'),
      fees: [],
      hasValue: false,
      immeasurable: false,
      logIndex: 52,
      maker: '0xca77dc47eec9e1c46c9f541ba0f222e741d6236b',
      orderHash:
        '0xf8174cbb0ed8fb158bb0e775c325fc81e4a260f23384382119c220a078068d2a',
      pool:
        '0x0000000000000000000000000000000000000000000000000000000000000017',
      protocolVersion: 4,
      status: 1,
      taker: '0x975eac3e6da5281d00844b251cd146b9621ef824',
      transactionHash:
        '0x57247fbc2207d298bd161ccf4bdd37545c0baf3f92cb65ad82f25083577a07b1',
      type: 6,
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
      'created fill for RfqOrderFilled event: 600e7acbb1592424e2dadd73',
    );
  });

  it('should not create fill if it already exists for RfqOrderFilled event', async () => {
    await Event.create([
      {
        _id: '600e7acbb1592424e2dadd73',
        protocolVersion: 4,
        blockNumber: 11609845,
        data: {
          maker: '0xca77dc47eec9e1c46c9f541ba0f222e741d6236b',
          makerToken: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          makerTokenFilledAmount: '5320',
          orderHash:
            '0xf8174cbb0ed8fb158bb0e775c325fc81e4a260f23384382119c220a078068d2a',
          pool:
            '0x0000000000000000000000000000000000000000000000000000000000000017',
          taker: '0x975eac3e6da5281d00844b251cd146b9621ef824',
          takerToken: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
          takerTokenFilledAmount: '10000000000000',
        },
        dateIngested: new Date('2021-01-25T08:01:15.872Z'),
        logIndex: 52,
        transactionHash:
          '0x57247fbc2207d298bd161ccf4bdd37545c0baf3f92cb65ad82f25083577a07b1',
        type: 'RfqOrderFilled',
        __v: 0,
        scheduler: {
          transactionFetchScheduled: true,
        },
      },
    ]);

    await Transaction.create({
      _id: '601eb2ca2cfb457ba927c6bd',
      blockHash:
        '0xd5c5b303f9e457afb48c9028c3bc318b8781634a4ea9f1ca37850ad8db3a453c',
      blockNumber: 11609845,
      data:
        '0x438cdfc5000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000000000000000000000000000000000000ee6b2800000000000000000000000000000000000000000000000000685701b9b2e1000000000000000000000000000ca77dc47eec9e1c46c9f541ba0f222e741d6236b000000000000000000000000975eac3e6da5281d00844b251cd146b9621ef824000000000000000000000000975eac3e6da5281d00844b251cd146b9621ef8240000000000000000000000000000000000000000000000000000000000000017000000000000000000000000000000000000000000000000000000005ff779fe00000000000000000000000000000000000000000000000000000176dea545f00000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000001bf86b983c81619c0350a083c8a81ca016b46d272a8c4204326fee4db6a88b1dc53755305b0fa4437844da78d83d5d852c0801a74b4da678b30842d1b955535c42000000000000000000000000000000000000000000000000000009184e72a000',
      date: new Date('2021-01-07T21:07:11.000Z'),
      from: '0x975eac3e6da5281d00844b251cd146b9621ef824',
      gasLimit: 126869,
      gasPrice: '100000100000',
      gasUsed: 125496,
      hash:
        '0x57247fbc2207d298bd161ccf4bdd37545c0baf3f92cb65ad82f25083577a07b1',
      index: 30,
      nonce: '161',
      to: '0xdef1c0ded9bec7f1a1670819833240f027b25eff',
      value: '0',
    });

    await Fill.create([
      {
        _id: '600e7acbb1592424e2dadd73',
        attributions: [],
        assets: [
          {
            actor: 0,
            amount: 5320,
            tokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            tokenResolved: false,
          },
          {
            actor: 1,
            amount: 10000000000000,
            tokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
            tokenResolved: false,
          },
        ],
        blockHash:
          '0xd5c5b303f9e457afb48c9028c3bc318b8781634a4ea9f1ca37850ad8db3a453c',
        blockNumber: 11609845,
        date: new Date('2021-01-07T21:07:11.000Z'),
        eventId: '600e7acbb1592424e2dadd73',
        fees: [],
        hasValue: false,
        immeasurable: false,
        logIndex: 52,
        maker: '0xca77dc47eec9e1c46c9f541ba0f222e741d6236b',
        orderHash:
          '0xf8174cbb0ed8fb158bb0e775c325fc81e4a260f23384382119c220a078068d2a',
        pool:
          '0x0000000000000000000000000000000000000000000000000000000000000017',
        protocolVersion: 4,
        status: 1,
        taker: '0x975eac3e6da5281d00844b251cd146b9621ef824',
        transactionHash:
          '0x57247fbc2207d298bd161ccf4bdd37545c0baf3f92cb65ad82f25083577a07b1',
        type: 6,
      },
    ]);

    const job = { data: { eventId: '600e7acbb1592424e2dadd73' } };

    await createFillsForEvent.fn(job, mockOptions);

    const fills = await Fill.find().lean();

    expect(fills).toHaveLength(1);
    expect(mockOptions.logger.warn).toHaveBeenCalledTimes(1);
    expect(mockOptions.logger.warn).toHaveBeenCalledWith(
      'fill for RfqOrderFilled event already exists: 600e7acbb1592424e2dadd73',
    );
  });
});
