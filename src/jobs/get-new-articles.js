const _ = require('lodash');
const cheerio = require('cheerio');
const Parser = require('rss-parser');
const signale = require('signale');

const { logError } = require('../util/error-logger');
const Article = require('../model/article');

const logger = signale.scope('get new articles');

const feedUrls = {
  '0xproject': 'https://medium.com/feed/0x-project',
  '0xtracker': 'https://medium.com/feed/0x-tracker',
  amadeus: 'https://medium.com/feed/amadeus-relay',
  boxSwap: 'https://medium.com/feed/boxswap',
  emoon: 'https://medium.com/feed/@emoonmarket',
  ercdex: 'https://medium.com/feed/ercdex',
  ethfinex: 'https://medium.com/feed/ethfinex',
  dharma: 'https://medium.com/feed/dharma-blog',
  dYdX: 'https://medium.com/feed/dydxderivatives',
  ledgerDex: 'https://medium.com/feed/ledgerdex',
  openRelay: 'https://blog.openrelay.xyz/feed.xml',
  paradex: 'https://medium.com/feed/paradex',
  radarrelay: 'https://medium.com/feed/@RadarRelay',
  sharkRelay: 'https://medium.com/feed/sharkrelay',
  theOcean: 'https://medium.com/feed/@theoceantrade',
  veil: 'https://medium.com/feed/veil-blog',
};

const getNewArticles = async () => {
  // throw new Error('boom');
  const feeds = await Promise.all(
    _.map(_.keys(feedUrls), async feedId => {
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

      return { id: feedId, items: result.items };
    }),
  );

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
    `${articleGuids.length} articles were found, ${
      newArticles.length
    } of them are new`,
  );
  logger.pending(`adding ${newArticles.length} new articles`);

  await Article.insertMany(newArticles);

  logger.success(`added ${newArticles.length} new articles`);
};

module.exports = getNewArticles;
