const _ = require('lodash');
const bluebird = require('bluebird');
const cheerio = require('cheerio');
const metaget = require('metaget');
const Parser = require('rss-parser');
const signale = require('signale');
const slugify = require('slugify');

const { logError } = require('../util/error-logger');
const Article = require('../model/article');
const getFeedDefinitions = require('../feeds/get-feed-definitions');

const logger = signale.scope('get new articles');

const getItemContent = item => {
  const content = item['content:encoded'] || item.content;

  return content;
};

const getItemSummary = item => {
  const content = getItemContent(item);

  if (content === undefined) {
    return undefined;
  }

  const tags = cheerio.load(content)('h4,p');

  if (tags.length === 0) {
    return content;
  }

  return tags.first().text();
};

const fetchMetadata = async url => {
  const metaResponse = await metaget.fetch(url);

  return _.pick(metaResponse, [
    'og:title',
    'og:image',
    'og:description',
    'twitter:card',
    'twitter:title',
    'twitter:description',
    'twitter:image:src',
  ]);
};

const processNewArticles = async (feedItems, existingItemGuids) => {
  const articles = feedItems
    .filter(item => !existingItemGuids.includes(item.guid))
    .map(item => ({
      feed: item.feedId,
      title: item.title,
      url: item.link,
      content: getItemContent(item),
      slug: slugify(item.title, { lower: true, strict: true }),
      summary: getItemSummary(item),
      author: item.creator,
      date: item.isoDate,
      guid: item.guid,
    }));

  if (articles.length === 0) {
    logger.info('no new feed items found');
    return;
  }

  logger.info(`new feed items found: ${articles.length}`);

  await bluebird.each(articles, async article => {
    const metadata = await fetchMetadata(article.url);
    const newArticle = await Article.create({ ...article, metadata });

    logger.info(`created article: ${newArticle._id}`);
  });
};

const processExistingArticles = async (feedItems, existingArticles) => {
  await bluebird.each(existingArticles, async article => {
    const feedItem = feedItems.find(item => item.guid === article.guid);

    article.set('title', feedItem.title);
    article.set('url', feedItem.link);
    article.set('content', getItemContent(feedItem));
    article.set('summary', getItemSummary(feedItem));
    article.set('author', feedItem.creator);
    article.set('date', feedItem.isoDate);

    if (article.isModified()) {
      const metadata = await fetchMetadata(feedItem.link);
      article.set('metadata', metadata);

      await article.save();

      logger.info(`updated article: ${article._id}`);
    }
  });
};

const getNewArticles = async () => {
  logger.info('fetching articles');

  const feedDefinitions = getFeedDefinitions().filter(x => x.isActive);

  const feeds = await bluebird.mapSeries(
    feedDefinitions,
    async feedDefinition => {
      let result;
      try {
        const parser = new Parser();
        result = await parser.parseURL(feedDefinition.feedUrl);
      } catch (error) {
        logError(new Error(`Failed to parse feed: ${feedDefinition.feedUrl}`), {
          reason: error.message,
        });

        return { id: feedDefinition.id, items: [] };
      }

      await bluebird.delay(500);

      return { id: feedDefinition.id, items: result.items };
    },
  );

  const feedItems = _(feeds)
    .map(feed =>
      feed.items.map(item => ({
        ...item,
        feedId: feed.id,
        guid: item.guid || item.id,
      })),
    )
    .flatten()
    .value();

  if (feedItems.length === 0) {
    logger.info('no feed items found');
    return;
  }

  logger.info(`fetched feed items: ${feedItems.length}`);

  const itemGuids = feedItems.map(item => item.guid);
  const existingArticles = await Article.find({ guid: { $in: itemGuids } });
  const existingGuids = existingArticles.map(article => article.guid);

  await Promise.all([
    processNewArticles(feedItems, existingGuids),
    processExistingArticles(feedItems, existingArticles),
  ]);

  logger.info('finished fetching articles');
};

module.exports = getNewArticles;
