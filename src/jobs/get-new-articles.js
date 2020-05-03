const _ = require('lodash');
const bluebird = require('bluebird');
const cheerio = require('cheerio');
const Parser = require('rss-parser');
const signale = require('signale');
const slugify = require('slugify');

const { logError } = require('../util/error-logger');
const Article = require('../model/article');

const logger = signale.scope('get new articles');

const feedUrls = {
  '0xproject': 'https://medium.com/feed/0x-project',
  '0xtracker': 'https://medium.com/feed/0x-tracker',
  boxSwap: 'https://medium.com/feed/boxswap',
  emoon: 'https://medium.com/feed/@emoonmarket',
  ercdex: 'https://medium.com/feed/ercdex',
  ethfinex: 'https://medium.com/feed/ethfinex',
  dYdX: 'https://medium.com/feed/dydxderivatives',
  ledgerDex: 'https://medium.com/feed/ledgerdex',
  oc2Dex: 'https://medium.com/feed/oc2-realm',
  openRelay: 'https://blog.openrelay.xyz/feed.xml',
  paradex: 'https://medium.com/feed/paradex',
  radarrelay: 'https://medium.com/feed/radartech',
  theOcean: 'https://medium.com/feed/@theoceantrade',
  tokenlon: 'https://medium.com/feed/imtoken/tagged/tokenlon',
  veil: 'https://medium.com/feed/veil-blog',
};

const getNewArticles = async () => {
  logger.time('fetch rss feeds');

  const feeds = await bluebird.mapSeries(_.keys(feedUrls), async feedId => {
    const url = feedUrls[feedId];

    let result;
    try {
      const parser = new Parser();
      result = await parser.parseURL(url);
    } catch (error) {
      logError(new Error(`Failed to parse feed: ${url}`), {
        reason: error.message,
      });

      return { id: feedId, items: [] };
    }

    await bluebird.delay(500);

    return { id: feedId, items: result.items };
  });

  logger.timeEnd('fetch rss feeds');
  logger.info(`fetched ${feeds.length} rss feeds`);

  const articleGuids = _(feeds)
    .map(feed => feed.items.map(item => item.guid))
    .flatten()
    .value();
  const existingArticles = await Article.find({ guid: { $in: articleGuids } });
  const existingGuids = existingArticles.map(article => article.guid);
  const newArticles = _.flatten(
    feeds.map(feed =>
      feed.items
        .filter(item => !existingGuids.includes(item.guid))
        .map(item => ({
          feed: feed.id,
          title: item.title,
          url: item.link,
          content: item['content:encoded'] || item.content,
          slug: slugify(item.title, { lower: true, strict: true }),
          summary: cheerio
            .load(item['content:encoded'] || item.content)('h4,p')
            .first()
            .text(),
          author: item.creator,
          date: item.isoDate,
          guid: item.guid,
        })),
    ),
  );

  if (newArticles.length === 0) {
    logger.info('no new articles were found');

    return;
  }

  logger.info(
    `${articleGuids.length} articles were found, ${newArticles.length} of them are new`,
  );
  logger.pending(`adding ${newArticles.length} new articles`);

  await Article.insertMany(newArticles);

  logger.success(`added ${newArticles.length} new articles`);
};

module.exports = getNewArticles;
