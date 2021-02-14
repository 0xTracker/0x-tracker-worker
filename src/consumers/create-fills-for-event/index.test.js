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

    await createFillsForEvent.fn(job, mockOptions);

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

  it('should not create fill if it already exists for UniswapV2Swap event', async () => {
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
    await createFillsForEvent.fn(job, mockOptions);
    const fills = await Fill.find().lean();

    expect(fills).toHaveLength(1);
    expect(mockOptions.logger.warn).toHaveBeenCalledTimes(1);
    expect(mockOptions.logger.warn).toHaveBeenCalledWith(
      'fill for UniswapV2Swap event already exists: 5f70cb40b8c4ca3f1e6cc17f',
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

    await createFillsForEvent.fn(job, mockOptions);

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

  it('should not create fill if it already exists for SushiswapSwap event', async () => {
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
    await createFillsForEvent.fn(job, mockOptions);
    const fills = await Fill.find().lean();

    expect(fills).toHaveLength(1);
    expect(mockOptions.logger.warn).toHaveBeenCalledTimes(1);
    expect(mockOptions.logger.warn).toHaveBeenCalledWith(
      'fill for SushiswapSwap event already exists: 5f74ac562d14a830369657bc',
    );
  });

  it('should create fill for LiquidityProviderSwap event', async () => {
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

    await createFillsForEvent.fn(job, mockOptions);

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

  it('should not create fill if it already exists for LiquidityProviderSwap event', async () => {
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
    await createFillsForEvent.fn(job, mockOptions);
    const fills = await Fill.find().lean();

    expect(fills).toHaveLength(1);
    expect(mockOptions.logger.warn).toHaveBeenCalledWith(
      'fill for LiquidityProviderSwap event already exists: 5fccb51fdc7acd504bd8c2ce',
    );
  });

  it('should throw an error when the associated transaction contains multiple TransformedERC20 events', async () => {
    await Event.create([
      {
        _id: '5f2e9c576b2c7f29ee87cf7a',
        protocolVersion: 3,
        blockNumber: 10415496,
        data: {
          inputToken: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          inputTokenAmount: '50000000',
          outputToken: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
          outputTokenAmount: '208673471330773057',
          taker: '0x8b58750df7d41f91a281a496e160a827fdc4de0a',
        },
        dateIngested: new Date('2020-08-08T12:36:39.660Z'),
        logIndex: 141,
        transactionHash:
          '0xaa4b893152c32279ff7090f88e9388034d60d980a2c480c0664c61458cc4d9c9',
        type: 'TransformedERC20',
      },
      {
        _id: '5f2e9c576b2c7f29ee87cf7b',
        protocolVersion: 3,
        blockNumber: 10422135,
        data: {
          inputToken: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
          inputTokenAmount: '100000000000000000',
          outputToken: '0xc00e94cb662c3520282e6f5717214004a7f26888',
          outputTokenAmount: '133654917647375782',
          taker: '0x0000001cd3a26c74eceb9938790cf1c054c0ebbf',
        },
        dateIngested: new Date('2020-08-08T12:36:39.661Z'),
        logIndex: 102,
        transactionHash:
          '0xaa4b893152c32279ff7090f88e9388034d60d980a2c480c0664c61458cc4d9c9',
        type: 'TransformedERC20',
      },
    ]);

    await Transaction.create({
      _id: '5f0d0348bd849b81bfb71729',
      hash:
        '0xaa4b893152c32279ff7090f88e9388034d60d980a2c480c0664c61458cc4d9c9',
      affiliateAddress: '0x1000000000000000000000000000000000000011',
      blockHash:
        '0xda729c2ac56536cbf88ec0a88eba7f28cb5db66dcde2e20829e972023ae68d80',
      blockNumber: 10415496,
      data:
        '0x415565b0000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000000000000000000000000000000000000000000000000000000002faf08000000000000000000000000000000000000000000000000002cdc0c56d19239800000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000008600000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000007c000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc200000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000066000000000000000000000000000000000000000000000000000000000000007800000000000000000000000000000000000000000000000000000000002faf080000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000260000000000000000000000000bb004090d26845b672f17c6da4b7d162df3bfc5e00000000000000000000000022f9dcf4647084d6c31b2765f6910cd85c178c180000000000000000000000001000000000000000000000000000000000000011000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002e55b6aa4b7e8410000000000000000000000000000000000000000000000000000000002faf08000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005f050ede000000000000000000000000000000000000000000000000000001732bbd832000000000000000000000000000000000000000000000000000000000000001c000000000000000000000000000000000000000000000000000000000000004c0000000000000000000000000000000000000000000000000000000000000064000000000000000000000000000000000000000000000000000000000000006400000000000000000000000000000000000000000000000000000000000000024f47261b0000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000000000000000000000000000000000000000000000000000000000000000000000000000000036691c4f426eb8f42f150ebde43069a31cb080ad00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002cdc0c56d1923980000000000000000000000000000000000000000000000000000000002faf08000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005f0529d31c4427f53ec3c2fd10cbdde1226fecffaac9180d91a8a2a9e2a308ef623e0c3f00000000000000000000000000000000000000000000000000000000000001c000000000000000000000000000000000000000000000000000000000000002a00000000000000000000000000000000000000000000000000000000000000420000000000000000000000000000000000000000000000000000000000000042000000000000000000000000000000000000000000000000000000000000000a4dc1600f3000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc200000000000000000000000036691c4f426eb8f42f150ebde43069a31cb080ad00000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000020000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000024f47261b0000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000000421c19165fa23af77cc09979e52a8f350c3f08e4a79a4e2b9045ec7036910eec07c505aaa8030aa674135cbe3dd1bdc35daf78a24137626186ed32e68a0d12848c35020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001040000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000003000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee0000000000000000000000000000000000000000000000000000000000000000869584cd0000000000000000000000001000000000000000000000000000000000000011000000000000000000000000000000000000000000000000000000005f050db4',
      date: new Date('2020-07-08T00:06:01.000Z'),
      from: '0x8b58750df7d41f91a281a496e160a827fdc4de0a',
      gasLimit: 605952,
      gasPrice: '20100000000',
      gasUsed: 350319,
      index: 91,
      nonce: '35',
      quoteDate: new Date('2020-07-08T00:05:08.000Z'),
      to: '0xdef1c0ded9bec7f1a1670819833240f027b25eff',
      value: '6030000000000000',
    });

    const job = { data: { eventId: '5f2e9c576b2c7f29ee87cf7b' } };

    await expect(createFillsForEvent.fn(job, mockOptions)).rejects.toThrow(
      new Error(
        'Transaction contains multiple TransformedERC20 events: 0xaa4b893152c32279ff7090f88e9388034d60d980a2c480c0664c61458cc4d9c9',
      ),
    );
  });

  it('should finish job early and log outcome when TransformedERC20 event has no associated ERC20BridgeTransfer or BridgeFill events', async () => {
    await Event.create([
      {
        _id: '5f2e9c576b2c7f29ee87cf7a',
        protocolVersion: 3,
        blockNumber: 10415496,
        data: {
          inputToken: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          inputTokenAmount: '50000000',
          outputToken: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
          outputTokenAmount: '208673471330773057',
          taker: '0x8b58750df7d41f91a281a496e160a827fdc4de0a',
        },
        dateIngested: new Date('2020-08-08T12:36:39.660Z'),
        logIndex: 141,
        transactionHash:
          '0xaa4b893152c32279ff7090f88e9388034d60d980a2c480c0664c61458cc4d9c9',
        type: 'TransformedERC20',
      },
    ]);

    await Transaction.create({
      hash:
        '0xaa4b893152c32279ff7090f88e9388034d60d980a2c480c0664c61458cc4d9c9',
      affiliateAddress: '0x1000000000000000000000000000000000000011',
      blockHash:
        '0xda729c2ac56536cbf88ec0a88eba7f28cb5db66dcde2e20829e972023ae68d80',
      blockNumber: 10415496,
      data:
        '0x415565b0000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000000000000000000000000000000000000000000000000000000002faf08000000000000000000000000000000000000000000000000002cdc0c56d19239800000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000008600000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000007c000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc200000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000066000000000000000000000000000000000000000000000000000000000000007800000000000000000000000000000000000000000000000000000000002faf080000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000260000000000000000000000000bb004090d26845b672f17c6da4b7d162df3bfc5e00000000000000000000000022f9dcf4647084d6c31b2765f6910cd85c178c180000000000000000000000001000000000000000000000000000000000000011000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002e55b6aa4b7e8410000000000000000000000000000000000000000000000000000000002faf08000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005f050ede000000000000000000000000000000000000000000000000000001732bbd832000000000000000000000000000000000000000000000000000000000000001c000000000000000000000000000000000000000000000000000000000000004c0000000000000000000000000000000000000000000000000000000000000064000000000000000000000000000000000000000000000000000000000000006400000000000000000000000000000000000000000000000000000000000000024f47261b0000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000000000000000000000000000000000000000000000000000000000000000000000000000000036691c4f426eb8f42f150ebde43069a31cb080ad00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002cdc0c56d1923980000000000000000000000000000000000000000000000000000000002faf08000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005f0529d31c4427f53ec3c2fd10cbdde1226fecffaac9180d91a8a2a9e2a308ef623e0c3f00000000000000000000000000000000000000000000000000000000000001c000000000000000000000000000000000000000000000000000000000000002a00000000000000000000000000000000000000000000000000000000000000420000000000000000000000000000000000000000000000000000000000000042000000000000000000000000000000000000000000000000000000000000000a4dc1600f3000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc200000000000000000000000036691c4f426eb8f42f150ebde43069a31cb080ad00000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000020000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000024f47261b0000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000000421c19165fa23af77cc09979e52a8f350c3f08e4a79a4e2b9045ec7036910eec07c505aaa8030aa674135cbe3dd1bdc35daf78a24137626186ed32e68a0d12848c35020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001040000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000003000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee0000000000000000000000000000000000000000000000000000000000000000869584cd0000000000000000000000001000000000000000000000000000000000000011000000000000000000000000000000000000000000000000000000005f050db4',
      date: new Date('2020-07-08T00:06:01.000Z'),
      from: '0x8B58750df7D41F91a281A496e160A827fdc4De0A',
      gasLimit: 605952,
      gasPrice: '20100000000',
      gasUsed: 350319,
      index: 91,
      nonce: '35',
      quoteDate: new Date('2020-07-08T00:05:08.000Z'),
      to: '0xDef1C0ded9bec7F1a1670819833240f027b25EfF',
      value: '6030000000000000',
    });

    const job = { data: { eventId: '5f2e9c576b2c7f29ee87cf7a' } };

    await createFillsForEvent.fn(job, mockOptions);

    expect(mockOptions.logger.info).toHaveBeenCalledTimes(1);
    expect(mockOptions.logger.info).toHaveBeenCalledWith(
      'TransformedERC20 event has no associated ERC20BridgeTransfer or BridgeFill events: 5f2e9c576b2c7f29ee87cf7a',
    );
  });

  it('should create fills and tokens for ERC20BridgeTransfer events associated with TransformedERC20 event', async () => {
    await Event.create([
      {
        _id: '5f2e9cd16b2c7f29ee87cf91',
        protocolVersion: 3,
        blockNumber: 10556936,
        data: {
          inputToken: '0xc00e94cb662c3520282e6f5717214004a7f26888',
          inputTokenAmount: '100000000000000000000',
          outputToken: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
          outputTokenAmount: '40450989295945402080',
          taker: '0xfe2ecb650fabf37431cba75ec9545284ecfbb03c',
        },
        dateIngested: new Date('2020-08-08T12:38:40.678Z'),
        logIndex: 211,
        transactionHash:
          '0x7444e18b2993978e7757ddf930a765b4839ed197751a3b2b4072df39c02183f4',
        type: 'TransformedERC20',
        scheduler: {
          transactionFetchScheduled: true,
        },
      },
      {
        _id: '5f2e9ce47d03c56c732a4db7',
        blockNumber: 10556936,
        data: {
          from: '0xDcD6011f4C6B80e470D9487f5871a0Cba7C93f48',
          fromToken: '0xc00e94Cb662C3520282E6f5717214004A7f26888',
          fromTokenAmount: '71009454729185924462',
          to: '0x22F9dCF4647084d6C31b2765F6910cd85C178C18',
          toToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
          toTokenAmount: '28623942072790077811',
        },
        logIndex: 191,
        transactionHash:
          '0x7444e18b2993978e7757ddf930a765b4839ed197751a3b2b4072df39c02183f4',
        type: 'ERC20BridgeTransfer',
        protocolVersion: 3,
      },
      {
        _id: '5f2e9ce47d03c56c732a4db9',
        blockNumber: 10556936,
        data: {
          from: '0xfe01821Ca163844203220cd08E4f2B2FB43aE4E4',
          fromToken: '0xc00e94Cb662C3520282E6f5717214004A7f26888',
          fromTokenAmount: '4657404786458858330',
          to: '0x22F9dCF4647084d6C31b2765F6910cd85C178C18',
          toToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
          toTokenAmount: '1894136115665392813',
        },
        logIndex: 209,
        transactionHash:
          '0x7444e18b2993978e7757ddf930a765b4839ed197751a3b2b4072df39c02183f4',
        type: 'ERC20BridgeTransfer',
        protocolVersion: 3,
      },
      {
        _id: '5f2e9ce47d03c56c732a4db8',
        blockNumber: 10556936,
        data: {
          from: '0x1c29670F7a77f1052d30813A0a4f632C78A02610',
          fromToken: '0xc00e94Cb662C3520282E6f5717214004A7f26888',
          fromTokenAmount: '24333140484355217208',
          to: '0x22F9dCF4647084d6C31b2765F6910cd85C178C18',
          toToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
          toTokenAmount: '9932911107489931456',
        },
        logIndex: 202,
        transactionHash:
          '0x7444e18b2993978e7757ddf930a765b4839ed197751a3b2b4072df39c02183f4',
        type: 'ERC20BridgeTransfer',
        protocolVersion: 3,
      },
    ]);

    await Transaction.create({
      _id: '5f2e9ce47d03c56c732a4dba',
      affiliateAddress: '0x86003b044f70dac0abc80ac8957305b6370893ed',
      blockHash:
        '0x5344877c9fbfc75a6281f9c93fd4e131f7ac8524bc402eaa9224bced29a3d8cd',
      blockNumber: 10556936,
      data:
        '0x415565b0000000000000000000000000c00e94cb662c3520282e6f5717214004a7f26888000000000000000000000000eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee0000000000000000000000000000000000000000000000056bc75e2d6310000000000000000000000000000000000000000000000000000228d10edcf3e2aaae00000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000be00000000000000000000000000000000000000000000000000000000000000c80000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000b2000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c00e94cb662c3520282e6f5717214004a7f26888000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc200000000000000000000000000000000000000000000000000000000000000e00000000000000000000000000000000000000000000000000000000000000a200000000000000000000000000000000000000000000000000000000000000ae00000000000000000000000000000000000000000000000056bc75e2d631000000000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000003600000000000000000000000000000000000000000000000000000000000000600000000000000000000000000dcd6011f4c6b80e470d9487f5871a0cba7c93f4800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000186c919e9edb60eed000000000000000000000000000000000000000000000003d97442da1b4f156e00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005f220556647513fcd0988e673c82b8f9b5f09ae7309fc9a815f3eb7acd86d0d29c18f1bb00000000000000000000000000000000000000000000000000000000000001c00000000000000000000000000000000000000000000000000000000000000860000000000000000000000000000000000000000000000000000000000000098000000000000000000000000000000000000000000000000000000000000009800000000000000000000000000000000000000000000000000000000000000104dc1600f3000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000dcd6011f4c6b80e470d9487f5871a0cba7c93f480000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000002000000000000000000000000c00e94cb662c3520282e6f5717214004a7f26888000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000000000000000000000000000000000000000000000000000000000001c29670f7a77f1052d30813a0a4f632c78a02610000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000885569e8b909797200000000000000000000000000000000000000000000000151b0ae5917ab573800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005f22055654035b71f5807d2d07271769fe07b41cb681e4a4c8b5e7de01d7ae81f9cb023f00000000000000000000000000000000000000000000000000000000000001c000000000000000000000000000000000000000000000000000000000000005600000000000000000000000000000000000000000000000000000000000000680000000000000000000000000000000000000000000000000000000000000068000000000000000000000000000000000000000000000000000000000000000a4dc1600f3000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000000000000000000000001c29670f7a77f1052d30813a0a4f632c78a0261000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000020000000000000000000000000c00e94cb662c3520282e6f5717214004a7f2688800000000000000000000000000000000000000000000000000000000000000000000000000000000fe01821ca163844203220cd08e4f2b2fb43ae4e40000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001f40728a833acf4f0000000000000000000000000000000000000000000000004e591dee3287206c00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005f22055635f8815f265da53272f586f968cc0999605bcc3bfb4334d9d51271dd760d5b8900000000000000000000000000000000000000000000000000000000000001c000000000000000000000000000000000000000000000000000000000000002c000000000000000000000000000000000000000000000000000000000000003e000000000000000000000000000000000000000000000000000000000000003e000000000000000000000000000000000000000000000000000000000000000c4dc1600f3000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000fe01821ca163844203220cd08e4f2b2fb43ae4e400000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000040000000000000000000000000c00e94cb662c3520282e6f5717214004a7f26888000000000000000000000000a5910940b97b7b8771a01b202583fd9331cb8be3000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000024f47261b0000000000000000000000000c00e94cb662c3520282e6f5717214004a7f26888000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000000104000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000040000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000003000000000000000000000000c00e94cb662c3520282e6f5717214004a7f26888000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee0000000000000000000000000000000000000000000000000000000000000000869584cd00000000000000000000000086003b044f70dac0abc80ac8957305b6370893ed000000000000000000000000000000000000000000000000000000005f21e936',
      date: new Date('2020-07-29T21:25:53.000Z'),
      from: '0xfe2ecb650fabf37431cba75ec9545284ecfbb03c',
      gasLimit: 2173272,
      gasPrice: '45000000000',
      gasUsed: 814428,
      hash:
        '0x7444e18b2993978e7757ddf930a765b4839ed197751a3b2b4072df39c02183f4',
      index: 127,
      nonce: '3',
      quoteDate: new Date('2020-07-29T21:25:10.000Z'),
      to: '0xdef1c0ded9bec7f1a1670819833240f027b25eff',
      value: '0',
    });

    const job = { data: { eventId: '5f2e9cd16b2c7f29ee87cf91' } };

    await createFillsForEvent.fn(job, mockOptions);

    const fills = await Fill.find().lean();

    const fillA = fills.find(
      f => f._id.toString() === '5f2e9ce47d03c56c732a4db7',
    );
    const fillB = fills.find(
      f => f._id.toString() === '5f2e9ce47d03c56c732a4db9',
    );
    const fillC = fills.find(
      f => f._id.toString() === '5f2e9ce47d03c56c732a4db8',
    );

    expect(fills).toHaveLength(3);
    expect(fillA).toEqual({
      __v: 0,
      _id: mongoose.Types.ObjectId('5f2e9ce47d03c56c732a4db7'),
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
          amount: 71009454729185924462,
          bridgeAddress: '0xdcd6011f4c6b80e470d9487f5871a0cba7c93f48',
          tokenAddress: '0xc00e94cb662c3520282e6f5717214004a7f26888',
          tokenResolved: false,
        },
        {
          _id: expect.anything(),
          actor: 1,
          amount: 28623942072790077811,
          tokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
          tokenResolved: false,
        },
      ],
      blockHash:
        '0x5344877c9fbfc75a6281f9c93fd4e131f7ac8524bc402eaa9224bced29a3d8cd',
      blockNumber: 10556936,
      date: new Date('2020-07-29T21:25:53.000Z'),
      eventId: mongoose.Types.ObjectId('5f2e9ce47d03c56c732a4db7'),
      fees: [],
      hasValue: false,
      immeasurable: false,
      logIndex: 191,
      maker: '0xdcd6011f4c6b80e470d9487f5871a0cba7c93f48',
      protocolVersion: 3,
      quoteDate: new Date('2020-07-29T21:25:10.000Z'),
      relayerId: 35,
      status: 1,
      taker: '0xfe2ecb650fabf37431cba75ec9545284ecfbb03c',
      transactionHash:
        '0x7444e18b2993978e7757ddf930a765b4839ed197751a3b2b4072df39c02183f4',
      type: 1,
    });

    expect(fillB).toEqual({
      __v: 0,
      _id: mongoose.Types.ObjectId('5f2e9ce47d03c56c732a4db9'),
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
          amount: 4657404786458858330,
          bridgeAddress: '0xfe01821ca163844203220cd08e4f2b2fb43ae4e4',
          tokenAddress: '0xc00e94cb662c3520282e6f5717214004a7f26888',
          tokenResolved: false,
        },
        {
          _id: expect.anything(),
          actor: 1,
          amount: 1894136115665392813,
          tokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
          tokenResolved: false,
        },
      ],
      blockHash:
        '0x5344877c9fbfc75a6281f9c93fd4e131f7ac8524bc402eaa9224bced29a3d8cd',
      blockNumber: 10556936,
      date: new Date('2020-07-29T21:25:53.000Z'),
      eventId: mongoose.Types.ObjectId('5f2e9ce47d03c56c732a4db9'),
      fees: [],
      hasValue: false,
      immeasurable: false,
      logIndex: 209,
      maker: '0xfe01821ca163844203220cd08e4f2b2fb43ae4e4',
      protocolVersion: 3,
      quoteDate: new Date('2020-07-29T21:25:10.000Z'),
      relayerId: 35,
      status: 1,
      taker: '0xfe2ecb650fabf37431cba75ec9545284ecfbb03c',
      transactionHash:
        '0x7444e18b2993978e7757ddf930a765b4839ed197751a3b2b4072df39c02183f4',
      type: 1,
    });

    expect(fillC).toEqual({
      __v: 0,
      _id: mongoose.Types.ObjectId('5f2e9ce47d03c56c732a4db8'),
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
          amount: 24333140484355217208,
          bridgeAddress: '0x1c29670f7a77f1052d30813a0a4f632c78a02610',
          tokenAddress: '0xc00e94cb662c3520282e6f5717214004a7f26888',
          tokenResolved: false,
        },
        {
          _id: expect.anything(),
          actor: 1,
          amount: 9932911107489931456,
          tokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
          tokenResolved: false,
        },
      ],
      blockHash:
        '0x5344877c9fbfc75a6281f9c93fd4e131f7ac8524bc402eaa9224bced29a3d8cd',
      blockNumber: 10556936,
      date: new Date('2020-07-29T21:25:53.000Z'),
      eventId: mongoose.Types.ObjectId('5f2e9ce47d03c56c732a4db8'),
      fees: [],
      hasValue: false,
      immeasurable: false,
      logIndex: 202,
      maker: '0x1c29670f7a77f1052d30813a0a4f632c78a02610',
      protocolVersion: 3,
      quoteDate: new Date('2020-07-29T21:25:10.000Z'),
      relayerId: 35,
      status: 1,
      taker: '0xfe2ecb650fabf37431cba75ec9545284ecfbb03c',
      transactionHash:
        '0x7444e18b2993978e7757ddf930a765b4839ed197751a3b2b4072df39c02183f4',
      type: 1,
    });

    const tokens = await Token.find().lean();

    expect(tokens).toHaveLength(2);
    expect(tokens).toEqual(
      expect.arrayContaining([
        {
          __v: 0,
          _id: expect.anything(),
          address: '0xc00e94cb662c3520282e6f5717214004a7f26888',
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
      'created fills for TransformedERC20 event: 5f2e9cd16b2c7f29ee87cf91',
    );
  });

  it('should only create the non-existant fills for ERC20BridgeTransfer events associated with TransformedERC20 event', async () => {
    await Event.create([
      {
        _id: '5f2e9cd16b2c7f29ee87cf91',
        protocolVersion: 3,
        blockNumber: 10556936,
        data: {
          inputToken: '0xc00e94cb662c3520282e6f5717214004a7f26888',
          inputTokenAmount: '100000000000000000000',
          outputToken: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
          outputTokenAmount: '40450989295945402080',
          taker: '0xfe2ecb650fabf37431cba75ec9545284ecfbb03c',
        },
        dateIngested: new Date('2020-08-08T12:38:40.678Z'),
        logIndex: 211,
        transactionHash:
          '0x7444e18b2993978e7757ddf930a765b4839ed197751a3b2b4072df39c02183f4',
        type: 'TransformedERC20',
        scheduler: {
          transactionFetchScheduled: true,
        },
      },
      {
        _id: '5f2e9ce47d03c56c732a4db7',
        blockNumber: 10556936,
        data: {
          from: '0xDcD6011f4C6B80e470D9487f5871a0Cba7C93f48',
          fromToken: '0xc00e94Cb662C3520282E6f5717214004A7f26888',
          fromTokenAmount: '71009454729185924462',
          to: '0x22F9dCF4647084d6C31b2765F6910cd85C178C18',
          toToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
          toTokenAmount: '28623942072790077811',
        },
        logIndex: 191,
        transactionHash:
          '0x7444e18b2993978e7757ddf930a765b4839ed197751a3b2b4072df39c02183f4',
        type: 'ERC20BridgeTransfer',
        protocolVersion: 3,
      },
      {
        _id: '5f2e9ce47d03c56c732a4db9',
        blockNumber: 10556936,
        data: {
          from: '0xfe01821Ca163844203220cd08E4f2B2FB43aE4E4',
          fromToken: '0xc00e94Cb662C3520282E6f5717214004A7f26888',
          fromTokenAmount: '4657404786458858330',
          to: '0x22F9dCF4647084d6C31b2765F6910cd85C178C18',
          toToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
          toTokenAmount: '1894136115665392813',
        },
        logIndex: 209,
        transactionHash:
          '0x7444e18b2993978e7757ddf930a765b4839ed197751a3b2b4072df39c02183f4',
        type: 'ERC20BridgeTransfer',
        protocolVersion: 3,
      },
      {
        _id: '5f2e9ce47d03c56c732a4db8',
        blockNumber: 10556936,
        data: {
          from: '0x1c29670F7a77f1052d30813A0a4f632C78A02610',
          fromToken: '0xc00e94Cb662C3520282E6f5717214004A7f26888',
          fromTokenAmount: '24333140484355217208',
          to: '0x22F9dCF4647084d6C31b2765F6910cd85C178C18',
          toToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
          toTokenAmount: '9932911107489931456',
        },
        logIndex: 202,
        transactionHash:
          '0x7444e18b2993978e7757ddf930a765b4839ed197751a3b2b4072df39c02183f4',
        type: 'ERC20BridgeTransfer',
        protocolVersion: 3,
      },
    ]);

    await Transaction.create({
      _id: '5f2e9ce47d03c56c732a4dba',
      affiliateAddress: '0x86003b044f70dac0abc80ac8957305b6370893ed',
      blockHash:
        '0x5344877c9fbfc75a6281f9c93fd4e131f7ac8524bc402eaa9224bced29a3d8cd',
      blockNumber: 10556936,
      data:
        '0x415565b0000000000000000000000000c00e94cb662c3520282e6f5717214004a7f26888000000000000000000000000eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee0000000000000000000000000000000000000000000000056bc75e2d6310000000000000000000000000000000000000000000000000000228d10edcf3e2aaae00000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000be00000000000000000000000000000000000000000000000000000000000000c80000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000b2000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c00e94cb662c3520282e6f5717214004a7f26888000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc200000000000000000000000000000000000000000000000000000000000000e00000000000000000000000000000000000000000000000000000000000000a200000000000000000000000000000000000000000000000000000000000000ae00000000000000000000000000000000000000000000000056bc75e2d631000000000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000003600000000000000000000000000000000000000000000000000000000000000600000000000000000000000000dcd6011f4c6b80e470d9487f5871a0cba7c93f4800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000186c919e9edb60eed000000000000000000000000000000000000000000000003d97442da1b4f156e00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005f220556647513fcd0988e673c82b8f9b5f09ae7309fc9a815f3eb7acd86d0d29c18f1bb00000000000000000000000000000000000000000000000000000000000001c00000000000000000000000000000000000000000000000000000000000000860000000000000000000000000000000000000000000000000000000000000098000000000000000000000000000000000000000000000000000000000000009800000000000000000000000000000000000000000000000000000000000000104dc1600f3000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000dcd6011f4c6b80e470d9487f5871a0cba7c93f480000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000002000000000000000000000000c00e94cb662c3520282e6f5717214004a7f26888000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000000000000000000000000000000000000000000000000000000000001c29670f7a77f1052d30813a0a4f632c78a02610000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000885569e8b909797200000000000000000000000000000000000000000000000151b0ae5917ab573800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005f22055654035b71f5807d2d07271769fe07b41cb681e4a4c8b5e7de01d7ae81f9cb023f00000000000000000000000000000000000000000000000000000000000001c000000000000000000000000000000000000000000000000000000000000005600000000000000000000000000000000000000000000000000000000000000680000000000000000000000000000000000000000000000000000000000000068000000000000000000000000000000000000000000000000000000000000000a4dc1600f3000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000000000000000000000001c29670f7a77f1052d30813a0a4f632c78a0261000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000020000000000000000000000000c00e94cb662c3520282e6f5717214004a7f2688800000000000000000000000000000000000000000000000000000000000000000000000000000000fe01821ca163844203220cd08e4f2b2fb43ae4e40000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001f40728a833acf4f0000000000000000000000000000000000000000000000004e591dee3287206c00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005f22055635f8815f265da53272f586f968cc0999605bcc3bfb4334d9d51271dd760d5b8900000000000000000000000000000000000000000000000000000000000001c000000000000000000000000000000000000000000000000000000000000002c000000000000000000000000000000000000000000000000000000000000003e000000000000000000000000000000000000000000000000000000000000003e000000000000000000000000000000000000000000000000000000000000000c4dc1600f3000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000fe01821ca163844203220cd08e4f2b2fb43ae4e400000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000040000000000000000000000000c00e94cb662c3520282e6f5717214004a7f26888000000000000000000000000a5910940b97b7b8771a01b202583fd9331cb8be3000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000024f47261b0000000000000000000000000c00e94cb662c3520282e6f5717214004a7f26888000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000000104000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000040000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000003000000000000000000000000c00e94cb662c3520282e6f5717214004a7f26888000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee0000000000000000000000000000000000000000000000000000000000000000869584cd00000000000000000000000086003b044f70dac0abc80ac8957305b6370893ed000000000000000000000000000000000000000000000000000000005f21e936',
      date: new Date('2020-07-29T21:25:53.000Z'),
      from: '0xfe2ecb650fabf37431cba75ec9545284ecfbb03c',
      gasLimit: 2173272,
      gasPrice: '45000000000',
      gasUsed: 814428,
      hash:
        '0x7444e18b2993978e7757ddf930a765b4839ed197751a3b2b4072df39c02183f4',
      index: 127,
      nonce: '3',
      quoteDate: new Date('2020-07-29T21:25:10.000Z'),
      to: '0xdef1c0ded9bec7f1a1670819833240f027b25eff',
      value: '0',
    });

    await Fill.create([
      {
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
            amount: 71009454729185924462,
            bridgeAddress: '0xdcd6011f4c6b80e470d9487f5871a0cba7c93f48',
            tokenAddress: '0xc00e94cb662c3520282e6f5717214004a7f26888',
            tokenResolved: false,
          },
          {
            actor: 1,
            amount: 28623942072790077811,
            tokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
            tokenResolved: false,
          },
        ],
        blockHash:
          '0x5344877c9fbfc75a6281f9c93fd4e131f7ac8524bc402eaa9224bced29a3d8cd',
        blockNumber: 10556936,
        date: new Date('2020-07-29T21:25:53.000Z'),
        eventId: '5f2e9ce47d03c56c732a4db7',
        fees: [],
        hasValue: false,
        immeasurable: false,
        logIndex: 191,
        maker: '0xdcd6011f4c6b80e470d9487f5871a0cba7c93f48',
        protocolVersion: 3,
        quoteDate: new Date('2020-07-29T21:25:10.000Z'),
        relayerId: 35,
        status: 1,
        taker: '0xfe2ecb650fabf37431cba75ec9545284ecfbb03c',
        transactionHash:
          '0x7444e18b2993978e7757ddf930a765b4839ed197751a3b2b4072df39c02183f4',
        type: 1,
      },
      {
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
            amount: 4657404786458858330,
            bridgeAddress: '0xfe01821ca163844203220cd08e4f2b2fb43ae4e4',
            tokenAddress: '0xc00e94cb662c3520282e6f5717214004a7f26888',
            tokenResolved: false,
          },
          {
            actor: 1,
            amount: 1894136115665392813,
            tokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
            tokenResolved: false,
          },
        ],
        blockHash:
          '0x5344877c9fbfc75a6281f9c93fd4e131f7ac8524bc402eaa9224bced29a3d8cd',
        blockNumber: 10556936,
        date: new Date('2020-07-29T21:25:53.000Z'),
        eventId: '5f2e9ce47d03c56c732a4db9',
        fees: [],
        hasValue: false,
        immeasurable: false,
        logIndex: 209,
        maker: '0xfe01821ca163844203220cd08e4f2b2fb43ae4e4',
        protocolVersion: 3,
        quoteDate: new Date('2020-07-29T21:25:10.000Z'),
        relayerId: 35,
        status: 1,
        taker: '0xfe2ecb650fabf37431cba75ec9545284ecfbb03c',
        transactionHash:
          '0x7444e18b2993978e7757ddf930a765b4839ed197751a3b2b4072df39c02183f4',
        type: 1,
      },
    ]);

    const job = { data: { eventId: '5f2e9cd16b2c7f29ee87cf91' } };

    await createFillsForEvent.fn(job, mockOptions);

    const fills = await Fill.find().lean();

    expect(fills).toHaveLength(3);
  });

  it('should not create fills when they all exist already for TransformedERC20 event', async () => {
    await Event.create([
      {
        _id: '5f2e9cd16b2c7f29ee87cf91',
        protocolVersion: 3,
        blockNumber: 10556936,
        data: {
          inputToken: '0xc00e94cb662c3520282e6f5717214004a7f26888',
          inputTokenAmount: '100000000000000000000',
          outputToken: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
          outputTokenAmount: '40450989295945402080',
          taker: '0xfe2ecb650fabf37431cba75ec9545284ecfbb03c',
        },
        dateIngested: new Date('2020-08-08T12:38:40.678Z'),
        logIndex: 211,
        transactionHash:
          '0x7444e18b2993978e7757ddf930a765b4839ed197751a3b2b4072df39c02183f4',
        type: 'TransformedERC20',
        scheduler: {
          transactionFetchScheduled: true,
        },
      },
      {
        _id: '5f2e9ce47d03c56c732a4db7',
        blockNumber: 10556936,
        data: {
          from: '0xDcD6011f4C6B80e470D9487f5871a0Cba7C93f48',
          fromToken: '0xc00e94Cb662C3520282E6f5717214004A7f26888',
          fromTokenAmount: '71009454729185924462',
          to: '0x22F9dCF4647084d6C31b2765F6910cd85C178C18',
          toToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
          toTokenAmount: '28623942072790077811',
        },
        logIndex: 191,
        transactionHash:
          '0x7444e18b2993978e7757ddf930a765b4839ed197751a3b2b4072df39c02183f4',
        type: 'ERC20BridgeTransfer',
        protocolVersion: 3,
      },
    ]);

    await Transaction.create({
      _id: '5f2e9ce47d03c56c732a4dba',
      affiliateAddress: '0x86003b044f70dac0abc80ac8957305b6370893ed',
      blockHash:
        '0x5344877c9fbfc75a6281f9c93fd4e131f7ac8524bc402eaa9224bced29a3d8cd',
      blockNumber: 10556936,
      data:
        '0x415565b0000000000000000000000000c00e94cb662c3520282e6f5717214004a7f26888000000000000000000000000eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee0000000000000000000000000000000000000000000000056bc75e2d6310000000000000000000000000000000000000000000000000000228d10edcf3e2aaae00000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000be00000000000000000000000000000000000000000000000000000000000000c80000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000b2000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c00e94cb662c3520282e6f5717214004a7f26888000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc200000000000000000000000000000000000000000000000000000000000000e00000000000000000000000000000000000000000000000000000000000000a200000000000000000000000000000000000000000000000000000000000000ae00000000000000000000000000000000000000000000000056bc75e2d631000000000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000003600000000000000000000000000000000000000000000000000000000000000600000000000000000000000000dcd6011f4c6b80e470d9487f5871a0cba7c93f4800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000186c919e9edb60eed000000000000000000000000000000000000000000000003d97442da1b4f156e00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005f220556647513fcd0988e673c82b8f9b5f09ae7309fc9a815f3eb7acd86d0d29c18f1bb00000000000000000000000000000000000000000000000000000000000001c00000000000000000000000000000000000000000000000000000000000000860000000000000000000000000000000000000000000000000000000000000098000000000000000000000000000000000000000000000000000000000000009800000000000000000000000000000000000000000000000000000000000000104dc1600f3000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000dcd6011f4c6b80e470d9487f5871a0cba7c93f480000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000002000000000000000000000000c00e94cb662c3520282e6f5717214004a7f26888000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000000000000000000000000000000000000000000000000000000000001c29670f7a77f1052d30813a0a4f632c78a02610000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000885569e8b909797200000000000000000000000000000000000000000000000151b0ae5917ab573800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005f22055654035b71f5807d2d07271769fe07b41cb681e4a4c8b5e7de01d7ae81f9cb023f00000000000000000000000000000000000000000000000000000000000001c000000000000000000000000000000000000000000000000000000000000005600000000000000000000000000000000000000000000000000000000000000680000000000000000000000000000000000000000000000000000000000000068000000000000000000000000000000000000000000000000000000000000000a4dc1600f3000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000000000000000000000001c29670f7a77f1052d30813a0a4f632c78a0261000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000020000000000000000000000000c00e94cb662c3520282e6f5717214004a7f2688800000000000000000000000000000000000000000000000000000000000000000000000000000000fe01821ca163844203220cd08e4f2b2fb43ae4e40000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001f40728a833acf4f0000000000000000000000000000000000000000000000004e591dee3287206c00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005f22055635f8815f265da53272f586f968cc0999605bcc3bfb4334d9d51271dd760d5b8900000000000000000000000000000000000000000000000000000000000001c000000000000000000000000000000000000000000000000000000000000002c000000000000000000000000000000000000000000000000000000000000003e000000000000000000000000000000000000000000000000000000000000003e000000000000000000000000000000000000000000000000000000000000000c4dc1600f3000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000fe01821ca163844203220cd08e4f2b2fb43ae4e400000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000040000000000000000000000000c00e94cb662c3520282e6f5717214004a7f26888000000000000000000000000a5910940b97b7b8771a01b202583fd9331cb8be3000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000024f47261b0000000000000000000000000c00e94cb662c3520282e6f5717214004a7f26888000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000000104000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000040000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000003000000000000000000000000c00e94cb662c3520282e6f5717214004a7f26888000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee0000000000000000000000000000000000000000000000000000000000000000869584cd00000000000000000000000086003b044f70dac0abc80ac8957305b6370893ed000000000000000000000000000000000000000000000000000000005f21e936',
      date: new Date('2020-07-29T21:25:53.000Z'),
      from: '0xfe2ecb650fabf37431cba75ec9545284ecfbb03c',
      gasLimit: 2173272,
      gasPrice: '45000000000',
      gasUsed: 814428,
      hash:
        '0x7444e18b2993978e7757ddf930a765b4839ed197751a3b2b4072df39c02183f4',
      index: 127,
      nonce: '3',
      quoteDate: new Date('2020-07-29T21:25:10.000Z'),
      to: '0xdef1c0ded9bec7f1a1670819833240f027b25eff',
      value: '0',
    });

    await Fill.create([
      {
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
            amount: 71009454729185924462,
            bridgeAddress: '0xdcd6011f4c6b80e470d9487f5871a0cba7c93f48',
            tokenAddress: '0xc00e94cb662c3520282e6f5717214004a7f26888',
            tokenResolved: false,
          },
          {
            actor: 1,
            amount: 28623942072790077811,
            tokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
            tokenResolved: false,
          },
        ],
        blockHash:
          '0x5344877c9fbfc75a6281f9c93fd4e131f7ac8524bc402eaa9224bced29a3d8cd',
        blockNumber: 10556936,
        date: new Date('2020-07-29T21:25:53.000Z'),
        eventId: '5f2e9ce47d03c56c732a4db7',
        fees: [],
        hasValue: false,
        immeasurable: false,
        logIndex: 191,
        maker: '0xdcd6011f4c6b80e470d9487f5871a0cba7c93f48',
        protocolVersion: 3,
        quoteDate: new Date('2020-07-29T21:25:10.000Z'),
        relayerId: 35,
        status: 1,
        taker: '0xfe2ecb650fabf37431cba75ec9545284ecfbb03c',
        transactionHash:
          '0x7444e18b2993978e7757ddf930a765b4839ed197751a3b2b4072df39c02183f4',
      },
    ]);

    const job = { data: { eventId: '5f2e9cd16b2c7f29ee87cf91' } };
    await createFillsForEvent.fn(job, mockOptions);
    const fills = await Fill.find().lean();

    expect(fills).toHaveLength(1);
  });

  /*
    This scenario handles an edge-case whereby some trades will emit two ERC20BridgeTransfer
    events for a single transfer. If the events are not deduped then volume gets double counted.
  */
  it('should dedupe associated ERC20BridgeTransfer events for TransformedERC20 event before creating fills', async () => {
    await Event.create([
      {
        _id: '5f4e754b6609e17174cbf1d2',
        protocolVersion: 3,
        blockNumber: 10776336,
        data: {
          inputToken: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          inputTokenAmount: '7108136500',
          outputToken: '0xdac17f958d2ee523a2206206994597c13d831ec7',
          outputTokenAmount: '7113021184',
          taker: '0x9b43818e253baed56e14a96d677347a06c77c6c1',
        },
        dateIngested: new Date('2020-09-01T16:22:35.629Z'),
        logIndex: 181,
        transactionHash:
          '0x70462e739348dfab76384297b7461293800163691b28b3ba5413c07465b6b6f1',
        type: 'TransformedERC20',
      },
      {
        _id: '5f4e7552a21d432dbead93f7',
        blockNumber: 10776336,
        data: {
          from: '0xAF76A7c57B441501bb7A6354728e3F5e13872139',
          fromToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          fromTokenAmount: '7108136500',
          to: '0x22F9dCF4647084d6C31b2765F6910cd85C178C18',
          toToken: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
          toTokenAmount: '7113021184',
        },
        logIndex: 177,
        transactionHash:
          '0x70462e739348dfab76384297b7461293800163691b28b3ba5413c07465b6b6f1',
        type: 'ERC20BridgeTransfer',
        protocolVersion: 3,
        dateIngested: new Date('2020-09-01T16:22:42.946Z'),
      },
      {
        _id: '5f4e7552a21d432dbead93f8',
        blockNumber: 10776336,
        data: {
          from: '0xAF76A7c57B441501bb7A6354728e3F5e13872139',
          fromToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          fromTokenAmount: '7108136500',
          to: '0x22F9dCF4647084d6C31b2765F6910cd85C178C18',
          toToken: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
          toTokenAmount: '7113021184',
        },
        logIndex: 179,
        transactionHash:
          '0x70462e739348dfab76384297b7461293800163691b28b3ba5413c07465b6b6f1',
        type: 'ERC20BridgeTransfer',
        protocolVersion: 3,
        dateIngested: new Date('2020-09-01T16:22:42.946Z'),
      },
    ]);

    await Transaction.create({
      _id: '5f4e7552a21d432dbead93f9',
      affiliateAddress: '0x86003b044f70dac0abc80ac8957305b6370893ed',
      blockHash:
        '0xa9bd4f1f3fa5d4f48aec53ed1b48220f24b6852a47c5a3fa914f955170d9171e',
      blockNumber: 10776336,
      data:
        '0x415565b0000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000000000000000000000000dac17f958d2ee523a2206206994597c13d831ec700000000000000000000000000000000000000000000000000000001a7ad8e3400000000000000000000000000000000000000000000000000000001a3baba9b00000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000005800000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000004e000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000000000000000000000000dac17f958d2ee523a2206206994597c13d831ec700000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000042000000000000000000000000000000000000000000000000000000000000004a000000000000000000000000000000000000000000000000000000001a7ad8e3400000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000020000000000000000000000000af76a7c57b441501bb7a6354728e3f5e1387213900000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001a3baba9c00000000000000000000000000000000000000000000000000000001a7ad8e3400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005f4e8fe246e26df6a55825fc5c6af245284ed8791df42e21c944c93609c175cc6c206f7000000000000000000000000000000000000000000000000000000000000001c000000000000000000000000000000000000000000000000000000000000002a00000000000000000000000000000000000000000000000000000000000000380000000000000000000000000000000000000000000000000000000000000038000000000000000000000000000000000000000000000000000000000000000a4dc1600f3000000000000000000000000dac17f958d2ee523a2206206994597c13d831ec7000000000000000000000000af76a7c57b441501bb7a6354728e3f5e1387213900000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000020000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000024f47261b0000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb4800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000001040000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000003000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000000000000000000000000dac17f958d2ee523a2206206994597c13d831ec7000000000000000000000000eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee0000000000000000000000000000000000000000000000000000000000000000869584cd00000000000000000000000086003b044f70dac0abc80ac8957305b6370893ed000000000000000000000000000000000000000000000033914ab5c85f4e73c2',
      date: new Date('2020-09-01T16:19:01.000Z'),
      from: '0x9b43818e253baed56e14a96d677347a06c77c6c1',
      gasLimit: 360091,
      gasPrice: '476000000000',
      gasUsed: 301570,
      hash:
        '0x70462e739348dfab76384297b7461293800163691b28b3ba5413c07465b6b6f1',
      index: 97,
      nonce: '690',
      quoteDate: new Date('2020-09-01T16:16:02.000Z'),
      to: '0xdef1c0ded9bec7f1a1670819833240f027b25eff',
      value: '0',
    });

    const job = { data: { eventId: '5f4e754b6609e17174cbf1d2' } };

    await createFillsForEvent.fn(job, mockOptions);

    const fills = await Fill.find().lean();

    expect(fills).toHaveLength(1);
  });

  it('should create fill and tokens for BridgeFill event associated with TransformedERC20 event', async () => {
    await Event.create([
      {
        _id: '6023e9801249f83bbbd3ef8b',
        protocolVersion: 3,
        blockNumber: 11829213,
        data: {
          inputToken: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          inputTokenAmount: '24273275100',
          outputToken: '0x57ab1ec28d129707052df4df418d58a2d46d5f51',
          outputTokenAmount: '24036998165225465615326',
          taker: '0x09212c58107c8da21b0f67a63e2144bb68bee4eb',
        },
        dateIngested: new Date('2021-02-10T14:11:12.939Z'),
        logIndex: 192,
        transactionHash:
          '0xfe220c86b626b1b25400e972b4162bb52878139fed8284882dc69ed13a42a04d',
        type: 'TransformedERC20',
        __v: 0,
        scheduler: {
          fillCreationScheduled: true,
          transactionFetchScheduled: true,
        },
      },
      {
        _id: '6023e998736ef210c5122ed8',
        blockNumber: 11829213,
        data: {
          inputToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          inputTokenAmount: '24273275100',
          outputToken: '0x57Ab1ec28D129707052df4dF418D58a2D46d5f51',
          outputTokenAmount: '24036998165225465615326',
          source: '3',
        },
        logIndex: 190,
        transactionHash:
          '0xfe220c86b626b1b25400e972b4162bb52878139fed8284882dc69ed13a42a04d',
        type: 'BridgeFill',
        protocolVersion: 4,
        dateIngested: new Date('2021-02-10T14:11:36.271Z'),
      },
    ]);

    await Transaction.create({
      _id: '6023e998736ef210c5122ed9',
      affiliateAddress: '0x86003b044f70dac0abc80ac8957305b6370893ed',
      blockHash:
        '0xe239e60818b4107ea7d3c4ea30ae739aa47c69c3a9fc2676c56602bf7dd4fbdb',
      blockNumber: 11829213,
      data:
        '0x415565b0000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb4800000000000000000000000057ab1ec28d129707052df4df418d58a2d46d5f5100000000000000000000000000000000000000000000000000000005a6ccc8dc00000000000000000000000000000000000000000000050a048e75052a498d4500000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000380000000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000002e000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb4800000000000000000000000057ab1ec28d129707052df4df418d58a2d46d5f51000000000000000000000000000000000000000000000000000000000000012000000000000000000000000000000000000000000000000000000000000002a000000000000000000000000000000000000000000000000000000000000002a0000000000000000000000000000000000000000000000000000000000000028000000000000000000000000000000000000000000000000000000005a6ccc8dc000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000005a6ccc8dc0000000000000000000000000000000000000000000005170c5c2dcc541693de00000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000080000000000000000000000000a5407eae9ba41422680e2e00537571bcc53efbfda6417ed60000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000007000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000003000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb4800000000000000000000000057ab1ec28d129707052df4df418d58a2d46d5f51000000000000000000000000eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee0000000000000000000000000000000000000000000000000000000000000000869584cd00000000000000000000000086003b044f70dac0abc80ac8957305b6370893ed0000000000000000000000000000000000000000000000ffcb5521f76023e8b4',
      date: new Date('2021-02-10T14:08:25.000Z'),
      from: '0x09212c58107c8da21b0f67a63e2144bb68bee4eb',
      gasLimit: 530813,
      gasPrice: '160000000000',
      gasUsed: 418111,
      hash:
        '0xfe220c86b626b1b25400e972b4162bb52878139fed8284882dc69ed13a42a04d',
      index: 99,
      nonce: '335',
      quoteDate: new Date('2021-02-10T14:07:48.000Z'),
      to: '0xdef1c0ded9bec7f1a1670819833240f027b25eff',
      value: '0',
    });

    const job = { data: { eventId: '6023e9801249f83bbbd3ef8b' } };

    await createFillsForEvent.fn(job, mockOptions);

    const fills = await Fill.find().lean();

    const fill = fills.find(
      f => f._id.toString() === '6023e998736ef210c5122ed8',
    );

    expect(fills).toHaveLength(1);
    expect(fill).toEqual({
      __v: 0,
      _id: mongoose.Types.ObjectId('6023e998736ef210c5122ed8'),
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
          amount: 24273275100,
          tokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          tokenResolved: false,
        },
        {
          _id: expect.anything(),
          actor: 1,
          amount: 24036998165225465615326,
          tokenAddress: '0x57ab1ec28d129707052df4df418d58a2d46d5f51',
          tokenResolved: false,
        },
      ],
      blockHash:
        '0xe239e60818b4107ea7d3c4ea30ae739aa47c69c3a9fc2676c56602bf7dd4fbdb',
      blockNumber: 11829213,
      date: new Date('2021-02-10T14:08:25.000Z'),
      eventId: mongoose.Types.ObjectId('6023e998736ef210c5122ed8'),
      fees: [],
      hasValue: false,
      immeasurable: false,
      logIndex: 190,
      protocolVersion: 4,
      quoteDate: new Date('2021-02-10T14:07:48.000Z'),
      relayerId: 35,
      source: '3',
      status: 1,
      taker: '0x09212c58107c8da21b0f67a63e2144bb68bee4eb',
      transactionHash:
        '0xfe220c86b626b1b25400e972b4162bb52878139fed8284882dc69ed13a42a04d',
      type: 7,
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
          address: '0x57ab1ec28d129707052df4df418d58a2d46d5f51',
          createdAt: expect.anything(),
          resolved: false,
          updatedAt: expect.anything(),
          type: 0,
        },
      ]),
    );

    expect(mockOptions.logger.info).toHaveBeenCalledTimes(1);
    expect(mockOptions.logger.info).toHaveBeenCalledWith(
      'created fills for TransformedERC20 event: 6023e9801249f83bbbd3ef8b',
    );
  });

  it('should skip TransformedERC20 event which contains both ERC20BridgeTransfer and BridgeFill events', async () => {
    await Event.create([
      {
        _id: '6023e9801249f83bbbd3ef8b',
        protocolVersion: 3,
        blockNumber: 11829213,
        data: {
          inputToken: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          inputTokenAmount: '24273275100',
          outputToken: '0x57ab1ec28d129707052df4df418d58a2d46d5f51',
          outputTokenAmount: '24036998165225465615326',
          taker: '0x09212c58107c8da21b0f67a63e2144bb68bee4eb',
        },
        dateIngested: new Date('2021-02-10T14:11:12.939Z'),
        logIndex: 192,
        transactionHash:
          '0xfe220c86b626b1b25400e972b4162bb52878139fed8284882dc69ed13a42a04d',
        type: 'TransformedERC20',
        __v: 0,
        scheduler: {
          fillCreationScheduled: true,
          transactionFetchScheduled: true,
        },
      },
      {
        _id: '6023e998736ef210c5122ed8',
        blockNumber: 11829213,
        data: {
          inputToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          inputTokenAmount: '24273275100',
          outputToken: '0x57Ab1ec28D129707052df4dF418D58a2D46d5f51',
          outputTokenAmount: '24036998165225465615326',
          source: '3',
        },
        logIndex: 190,
        transactionHash:
          '0xfe220c86b626b1b25400e972b4162bb52878139fed8284882dc69ed13a42a04d',
        type: 'BridgeFill',
        protocolVersion: 4,
        dateIngested: new Date('2021-02-10T14:11:36.271Z'),
      },
      {
        _id: '5f2d9b29dc18d040f57a28e6',
        blockNumber: 11829213,
        data: {
          from: '0xDcD6011f4C6B80e470D9487f5871a0Cba7C93f48',
          fromToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
          fromTokenAmount: '97336117500194229301',
          to: '0x6958F5e95332D93D21af0D7B9Ca85B8212fEE0A5',
          toToken: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
          toTokenAmount: '35172479234167111434316',
        },
        logIndex: 194,
        transactionHash:
          '0xfe220c86b626b1b25400e972b4162bb52878139fed8284882dc69ed13a42a04d',
        type: 'ERC20BridgeTransfer',
        protocolVersion: 3,
        scheduler: {
          transactionFetchScheduled: true,
        },
      },
    ]);

    await Transaction.create({
      _id: '6023e998736ef210c5122ed9',
      affiliateAddress: '0x86003b044f70dac0abc80ac8957305b6370893ed',
      blockHash:
        '0xe239e60818b4107ea7d3c4ea30ae739aa47c69c3a9fc2676c56602bf7dd4fbdb',
      blockNumber: 11829213,
      data:
        '0x415565b0000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb4800000000000000000000000057ab1ec28d129707052df4df418d58a2d46d5f5100000000000000000000000000000000000000000000000000000005a6ccc8dc00000000000000000000000000000000000000000000050a048e75052a498d4500000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000380000000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000002e000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb4800000000000000000000000057ab1ec28d129707052df4df418d58a2d46d5f51000000000000000000000000000000000000000000000000000000000000012000000000000000000000000000000000000000000000000000000000000002a000000000000000000000000000000000000000000000000000000000000002a0000000000000000000000000000000000000000000000000000000000000028000000000000000000000000000000000000000000000000000000005a6ccc8dc000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000005a6ccc8dc0000000000000000000000000000000000000000000005170c5c2dcc541693de00000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000080000000000000000000000000a5407eae9ba41422680e2e00537571bcc53efbfda6417ed60000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000007000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000003000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb4800000000000000000000000057ab1ec28d129707052df4df418d58a2d46d5f51000000000000000000000000eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee0000000000000000000000000000000000000000000000000000000000000000869584cd00000000000000000000000086003b044f70dac0abc80ac8957305b6370893ed0000000000000000000000000000000000000000000000ffcb5521f76023e8b4',
      date: new Date('2021-02-10T14:08:25.000Z'),
      from: '0x09212c58107c8da21b0f67a63e2144bb68bee4eb',
      gasLimit: 530813,
      gasPrice: '160000000000',
      gasUsed: 418111,
      hash:
        '0xfe220c86b626b1b25400e972b4162bb52878139fed8284882dc69ed13a42a04d',
      index: 99,
      nonce: '335',
      quoteDate: new Date('2021-02-10T14:07:48.000Z'),
      to: '0xdef1c0ded9bec7f1a1670819833240f027b25eff',
      value: '0',
    });

    const job = { data: { eventId: '6023e9801249f83bbbd3ef8b' } };

    await createFillsForEvent.fn(job, mockOptions);

    expect(mockOptions.logger.warn).toHaveBeenCalledTimes(1);
    expect(mockOptions.logger.warn).toHaveBeenCalledWith(
      'Transaction contains both BridgeFill and ERC20BridgeTransfer events: 0xfe220c86b626b1b25400e972b4162bb52878139fed8284882dc69ed13a42a04d',
    );
  });
});
