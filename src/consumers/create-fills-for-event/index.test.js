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
});
