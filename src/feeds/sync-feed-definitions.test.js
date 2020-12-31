const { getModel } = require('../model');
const getFeedDefinitions = require('./get-feed-definitions');
const syncFeedDefinitions = require('./sync-feed-definitions');
const testUtils = require('../test-utils');

jest.mock('./get-feed-definitions');

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

describe('attributions/syncFeedDefinitions', () => {
  it('should create all feed documents when none exist', async () => {
    getFeedDefinitions.mockImplementation(
      jest.requireActual('./get-feed-definitions'),
    );

    await syncFeedDefinitions({ logger: testUtils.mockLogger });

    const feeds = await getModel('ArticleFeed')
      .find()
      .lean();

    const matcha = await getModel('ArticleFeed')
      .findById('3609d2b6-0f89-4ecd-9069-484fd49f339b') // 0x Labs
      .lean();

    const paradex = await getModel('ArticleFeed')
      .findById('12f5f238-8eb3-4a77-a210-18c76b96a7fb') // Paradex
      .lean();

    expect(feeds.length).toBe(getFeedDefinitions().length);

    expect(matcha).toMatchObject({
      _id: '3609d2b6-0f89-4ecd-9069-484fd49f339b',
      feedUrl: 'https://medium.com/feed/0x-project',
      imageUrl: 'https://resources.0xtracker.com/logos/0x.png',
      isActive: true,
      name: '0x Labs',
      urlSlug: '0x-labs',
      websiteUrl: 'https://0x.org',
    });

    expect(paradex).toMatchObject({
      _id: '12f5f238-8eb3-4a77-a210-18c76b96a7fb',
      attributionEntityId: '9d72a8f4-d944-41c9-96e4-2636ea26eba1',
      feedUrl: 'https://medium.com/feed/paradex',
      isActive: false,
    });
  });

  it('should update attribution entity when definition metadata has changed', async () => {
    getFeedDefinitions.mockReturnValue([
      {
        id: '3609d2b6-0f89-4ecd-9069-484fd49f339b',
        feedUrl: 'https://medium.com/feed/0x-project',
        imageUrl: 'https://resources.0xtracker.com/logos/0x.png',
        isActive: true,
        name: '0x Labs',
        urlSlug: '0x-labs',
        websiteUrl: 'https://0x.org',
      },
    ]);

    await getModel('ArticleFeed').create({
      _id: '3609d2b6-0f89-4ecd-9069-484fd49f339b',
      feedUrl: 'https://medium.com/feed/0x-project',
      imageUrl: 'https://resources.0xtracker.com/logos/0x.png',
      isActive: true,
      name: '0x Team',
      urlSlug: '0x',
      websiteUrl: 'https://0x.org',
    });

    await syncFeedDefinitions({ logger: testUtils.mockLogger });

    const matcha = await getModel('ArticleFeed')
      .findById('3609d2b6-0f89-4ecd-9069-484fd49f339b') // 0x Labs
      .lean();

    expect(matcha).toMatchObject({
      _id: '3609d2b6-0f89-4ecd-9069-484fd49f339b',
      feedUrl: 'https://medium.com/feed/0x-project',
      imageUrl: 'https://resources.0xtracker.com/logos/0x.png',
      isActive: true,
      name: '0x Labs',
      urlSlug: '0x-labs',
      websiteUrl: 'https://0x.org',
    });
  });
});
