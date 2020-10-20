const { getModel } = require('../model');
const getEntityDefinitions = require('./get-entity-definitions');
const syncEntityDefinitions = require('./sync-entity-definitions');
const testUtils = require('../test-utils');

jest.mock('./get-entity-definitions');

beforeAll(async () => {
  await testUtils.setupDb();
}, 30000);

afterEach(async () => {
  await testUtils.resetDb();
  jest.resetAllMocks();
}, 30000);

afterAll(async () => {
  await testUtils.tearDownDb();
}, 30000);

describe('attributions/syncEntityDefinitions', () => {
  it('should create all attribution entity documents when none exist', async () => {
    getEntityDefinitions.mockImplementation(
      jest.requireActual('./get-entity-definitions'),
    );

    await syncEntityDefinitions({ logger: testUtils.mockLogger });

    const attributionEntities = await getModel('AttributionEntity')
      .find()
      .lean();

    const matcha = await getModel('AttributionEntity')
      .findById('5067df8b-f9cd-4a34-aee1-38d607100145') // Matcha
      .lean();

    expect(attributionEntities.length).toBe(getEntityDefinitions().length);
    expect(matcha).toMatchObject({
      _id: '5067df8b-f9cd-4a34-aee1-38d607100145',
      categories: ['dex-aggregator', 'relayer'],
      logoUrl:
        'https://cdn.staticaly.com/gh/0xTracker/0x-tracker-worker/master/src/attributions/logos/matcha.png',
      mappings: [
        {
          type: 0,
          feeRecipientAddress: '0x86003b044f70dac0abc80ac8957305b6370893ed',
        },
        {
          type: 1,
          affiliateAddress: '0x86003b044f70dac0abc80ac8957305b6370893ed',
        },
      ],
      name: 'Matcha',
      urlSlug: 'matcha',
      websiteUrl: 'https://matcha.xyz',
    });
  });

  it('should update attribution entity when definition metadata has changed', async () => {
    getEntityDefinitions.mockReturnValue([
      {
        id: '5067df8b-f9cd-4a34-aee1-38d607100145',
        name: 'Matcha',
        description:
          'Built by the 0x core team – Matcha is a DEX aggregator built on top of 0x API which allows users to easily swap tokens and place limit orders.',
        logo: 'matcha.png',
        urlSlug: 'matcha',
        websiteUrl: 'https://matcha.xyz',
        mappings: [
          {
            type: 'consumer',
            affiliateAddress: '0x86003b044f70dac0abc80ac8957305b6370893ed',
          },
          {
            feeRecipientAddress: '0x86003b044f70dac0abc80ac8957305b6370893ed',
            type: 'relayer',
          },
        ],
        categories: ['dex-aggregator', 'exchange'],
      },
    ]);

    await getModel('AttributionEntity').create({
      _id: '5067df8b-f9cd-4a34-aee1-38d607100145',
      categories: ['asset-swapper'],
      description:
        'Built by the 0x core team – Matcha is a DEX aggregator built on top of 0x API which allows users to easily swap tokens and place limit orders.',
      logoUrl:
        'https://cdn.staticaly.com/gh/0xTracker/0x-tracker-worker/master/src/attributions/logos/matcha-xyz.png',
      mappings: [
        {
          type: 1,
          affiliateAddress: '0x86003b044f70dac0abc80ac8957305b6370893ed',
        },
        {
          feeRecipientAddress: '0x86003b044f70dac0abc80ac8957305b6370893ed',
          type: 0,
        },
      ],
      name: 'Matcha xyz',
      urlSlug: 'matcha-xyz',
      websiteUrl: 'https://matcha-xyz.com',
    });

    await syncEntityDefinitions({ logger: testUtils.mockLogger });

    const matcha = await getModel('AttributionEntity')
      .findById('5067df8b-f9cd-4a34-aee1-38d607100145') // Matcha
      .lean();

    expect(matcha).toMatchObject({
      _id: '5067df8b-f9cd-4a34-aee1-38d607100145',
      categories: ['dex-aggregator', 'exchange'],
      description:
        'Built by the 0x core team – Matcha is a DEX aggregator built on top of 0x API which allows users to easily swap tokens and place limit orders.',
      logoUrl:
        'https://cdn.staticaly.com/gh/0xTracker/0x-tracker-worker/master/src/attributions/logos/matcha.png',
      mappings: [
        {
          type: 1,
          affiliateAddress: '0x86003b044f70dac0abc80ac8957305b6370893ed',
        },
        {
          type: 0,
          feeRecipientAddress: '0x86003b044f70dac0abc80ac8957305b6370893ed',
        },
      ],
      name: 'Matcha',
      urlSlug: 'matcha',
      websiteUrl: 'https://matcha.xyz',
    });
  });

  it('should update attribution entity when definition mappings have changed', async () => {
    getEntityDefinitions.mockReturnValue([
      {
        id: '5067df8b-f9cd-4a34-aee1-38d607100145',
        name: 'Matcha',
        description:
          'Built by the 0x core team – Matcha is a DEX aggregator built on top of 0x API which allows users to easily swap tokens and place limit orders.',
        logo: 'matcha.png',
        urlSlug: 'matcha',
        websiteUrl: 'https://matcha.xyz',
        mappings: [
          {
            type: 'consumer',
            affiliateAddress: '0x86003b044f70dac0abc80ac8957305b6370893ed',
          },
          {
            takerAddress: '0x86003b044f70dac0abc80ac8957305b6370893ed',
            type: 'relayer',
          },
        ],
        categories: ['dex-aggregator', 'exchange'],
      },
    ]);

    await getModel('AttributionEntity').create({
      _id: '5067df8b-f9cd-4a34-aee1-38d607100145',
      categories: ['dex-aggregator', 'exchange'],
      description:
        'Built by the 0x core team – Matcha is a DEX aggregator built on top of 0x API which allows users to easily swap tokens and place limit orders.',
      logoUrl:
        'https://cdn.staticaly.com/gh/0xTracker/0x-tracker-worker/master/src/attributions/logos/matcha.png',
      mappings: [
        {
          type: 1,
          affiliateAddress: '0x86003b044f70dac0abc80ac8957305b6370893ed',
        },
        {
          feeRecipientAddress: '0x86003b044f70dac0abc80ac8957305b6370893ed',
          type: 0,
        },
      ],
      name: 'Matcha',
      urlSlug: 'matcha',
      websiteUrl: 'https://matcha.xyz',
    });

    await syncEntityDefinitions({ logger: testUtils.mockLogger });

    const matcha = await getModel('AttributionEntity')
      .findById('5067df8b-f9cd-4a34-aee1-38d607100145') // Matcha
      .lean();

    expect(matcha).toMatchObject({
      _id: '5067df8b-f9cd-4a34-aee1-38d607100145',
      categories: ['dex-aggregator', 'exchange'],
      description:
        'Built by the 0x core team – Matcha is a DEX aggregator built on top of 0x API which allows users to easily swap tokens and place limit orders.',
      logoUrl:
        'https://cdn.staticaly.com/gh/0xTracker/0x-tracker-worker/master/src/attributions/logos/matcha.png',
      mappings: [
        {
          type: 1,
          affiliateAddress: '0x86003b044f70dac0abc80ac8957305b6370893ed',
        },
        {
          type: 0,
          takerAddress: '0x86003b044f70dac0abc80ac8957305b6370893ed',
        },
      ],
      name: 'Matcha',
      urlSlug: 'matcha',
      websiteUrl: 'https://matcha.xyz',
    });
  });

  it('should not update attribution entity if mappings have just been reorganised', async () => {
    getEntityDefinitions.mockReturnValue([
      {
        id: '5067df8b-f9cd-4a34-aee1-38d607100145',
        name: 'Matcha',
        description:
          'Built by the 0x core team – Matcha is a DEX aggregator built on top of 0x API which allows users to easily swap tokens and place limit orders.',
        logo: 'matcha.png',
        urlSlug: 'matcha',
        websiteUrl: 'https://matcha.xyz',
        mappings: [
          {
            feeRecipientAddress: '0x86003b044f70dac0abc80ac8957305b6370893ed',
            type: 'relayer',
          },
          {
            affiliateAddress: '0x86003b044f70dac0abc80ac8957305b6370893ed',
            type: 'consumer',
          },
        ],
        categories: ['dex-aggregator', 'exchange'],
      },
    ]);

    await getModel('AttributionEntity').create({
      _id: '5067df8b-f9cd-4a34-aee1-38d607100145',
      categories: ['dex-aggregator', 'exchange'],
      description:
        'Built by the 0x core team – Matcha is a DEX aggregator built on top of 0x API which allows users to easily swap tokens and place limit orders.',
      logoUrl:
        'https://cdn.staticaly.com/gh/0xTracker/0x-tracker-worker/master/src/attributions/logos/matcha.png',
      mappings: [
        {
          type: 1,
          affiliateAddress: '0x86003b044f70dac0abc80ac8957305b6370893ed',
        },
        {
          feeRecipientAddress: '0x86003b044f70dac0abc80ac8957305b6370893ed',
          type: 0,
        },
      ],
      name: 'Matcha',
      urlSlug: 'matcha',
      websiteUrl: 'https://matcha.xyz',
    });

    await syncEntityDefinitions({ logger: testUtils.mockLogger });

    const matcha = await getModel('AttributionEntity')
      .findById('5067df8b-f9cd-4a34-aee1-38d607100145') // Matcha
      .lean();

    expect(matcha).toMatchObject({
      _id: '5067df8b-f9cd-4a34-aee1-38d607100145',
      categories: ['dex-aggregator', 'exchange'],
      description:
        'Built by the 0x core team – Matcha is a DEX aggregator built on top of 0x API which allows users to easily swap tokens and place limit orders.',
      logoUrl:
        'https://cdn.staticaly.com/gh/0xTracker/0x-tracker-worker/master/src/attributions/logos/matcha.png',
      mappings: [
        {
          type: 1,
          affiliateAddress: '0x86003b044f70dac0abc80ac8957305b6370893ed',
        },
        {
          type: 0,
          feeRecipientAddress: '0x86003b044f70dac0abc80ac8957305b6370893ed',
        },
      ],
      name: 'Matcha',
      urlSlug: 'matcha',
      websiteUrl: 'https://matcha.xyz',
    });
  });
});
