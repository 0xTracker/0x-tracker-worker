const { getModel } = require('../model');
const getAppDefinitions = require('./get-app-definitions');
const syncAppDefinitions = require('./sync-app-definitions');
const testUtils = require('../test-utils');

jest.mock('./get-app-definitions');

beforeAll(async () => {
  await testUtils.setupDb();
});

afterEach(async () => {
  await testUtils.resetDb();
  jest.resetAllMocks();
});

afterAll(() => {
  testUtils.tearDownDb();
});

describe('apps/syncAppDefinitions', () => {
  it('should create all app documents when none exist', async () => {
    getAppDefinitions.mockImplementation(
      jest.requireActual('./get-app-definitions'),
    );

    await syncAppDefinitions();

    const apps = await getModel('App')
      .find()
      .lean();

    const matcha = await getModel('App')
      .findById('5067df8b-f9cd-4a34-aee1-38d607100145') // Matcha
      .lean();

    expect(apps.length).toBe(getAppDefinitions().length);
    expect(matcha).toMatchObject({
      _id: '5067df8b-f9cd-4a34-aee1-38d607100145',
      categories: ['dex-aggregator', 'exchange'],
      logoUrl: 'https://resources.0xtracker.com/logos/matcha.png',
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

  it('should update app when definition metadata has changed', async () => {
    getAppDefinitions.mockReturnValue([
      {
        id: '5067df8b-f9cd-4a34-aee1-38d607100145',
        name: 'Matcha',
        logoUrl: 'https://resources.0xtracker.com/logos/matcha.png',
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

    await getModel('App').create({
      _id: '5067df8b-f9cd-4a34-aee1-38d607100145',
      categories: ['asset-swapper'],
      logoUrl: 'https://resources.0xtracker.com/logos/matcha-xyz.png',
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

    await syncAppDefinitions();

    const matcha = await getModel('App')
      .findById('5067df8b-f9cd-4a34-aee1-38d607100145') // Matcha
      .lean();

    expect(matcha).toMatchObject({
      _id: '5067df8b-f9cd-4a34-aee1-38d607100145',
      categories: ['dex-aggregator', 'exchange'],
      logoUrl: 'https://resources.0xtracker.com/logos/matcha.png',
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

  it('should update app when definition mappings have changed', async () => {
    getAppDefinitions.mockReturnValue([
      {
        id: '5067df8b-f9cd-4a34-aee1-38d607100145',
        name: 'Matcha',
        logoUrl: 'https://resources.0xtracker.com/logos/matcha.png',
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

    await getModel('App').create({
      _id: '5067df8b-f9cd-4a34-aee1-38d607100145',
      categories: ['dex-aggregator', 'exchange'],
      logoUrl: 'https://resources.0xtracker.com/logos/matcha.png',
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

    await syncAppDefinitions();

    const matcha = await getModel('App')
      .findById('5067df8b-f9cd-4a34-aee1-38d607100145') // Matcha
      .lean();

    expect(matcha).toMatchObject({
      _id: '5067df8b-f9cd-4a34-aee1-38d607100145',
      categories: ['dex-aggregator', 'exchange'],
      logoUrl: 'https://resources.0xtracker.com/logos/matcha.png',
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

  it('should not update app if mappings have just been reorganised', async () => {
    getAppDefinitions.mockReturnValue([
      {
        id: '5067df8b-f9cd-4a34-aee1-38d607100145',
        name: 'Matcha',
        logoUrl: 'https://resources.0xtracker.com/logos/matcha.png',
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

    await getModel('App').create({
      _id: '5067df8b-f9cd-4a34-aee1-38d607100145',
      categories: ['dex-aggregator', 'exchange'],
      logoUrl: 'https://resources.0xtracker.com/logos/matcha.png',
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

    await syncAppDefinitions();

    const matcha = await getModel('App')
      .findById('5067df8b-f9cd-4a34-aee1-38d607100145') // Matcha
      .lean();

    expect(matcha).toMatchObject({
      _id: '5067df8b-f9cd-4a34-aee1-38d607100145',
      categories: ['dex-aggregator', 'exchange'],
      logoUrl: 'https://resources.0xtracker.com/logos/matcha.png',
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
