const _ = require('lodash');
const { flow, uniq, flatten, map } = require('lodash/fp');
const bluebird = require('bluebird');
const signale = require('signale');

const { getTokenInfo } = require('../util/ethplorer');
const Fill = require('../model/fill');
const tokenCache = require('../tokens/token-cache');
const Token = require('../model/token');

const logger = signale.scope('get missing tokens');

const getMissingTokens = async () => {
  const missingTokens = flow(
    flatten,
    map(result => result.tokenAddress),
    uniq,
  )(
    await Promise.all([
      Fill.aggregate([
        { $match: { 'tokenSaved.maker': { $in: [null, false] } } },
        { $group: { _id: { tokenAddress: '$makerToken' } } },
        { $project: { tokenAddress: '$_id.tokenAddress', _id: false } },
      ]),
      Fill.aggregate([
        { $match: { 'tokenSaved.taker': { $in: [null, false] } } },
        { $group: { _id: { tokenAddress: '$takerToken' } } },
        { $project: { tokenAddress: '$_id.tokenAddress', _id: false } },
      ]),
    ]),
  );

  if (missingTokens.length === 0) {
    logger.info('no tokens are missing');
    return;
  }

  logger.pending(`fetching ${missingTokens.length} missing tokens`);

  await bluebird.mapSeries(missingTokens, address =>
    getTokenInfo(address).then(async tokenInfo => {
      if (tokenInfo === null) {
        logger.warn(`no token info found for ${address}`);
        return;
      }

      const token = _.pick(tokenInfo, [
        'address',
        'name',
        'symbol',
        'decimals',
      ]);

      await Token.create(token);
      await Promise.all([
        Fill.updateMany(
          { makerToken: token.address },
          { $set: { 'tokenSaved.maker': true } },
        ),
        Fill.updateMany(
          { takerToken: token.address },
          { $set: { 'tokenSaved.taker': true } },
        ),
      ]);

      logger.success(`saved ${token.symbol} token`);
      tokenCache.addToken(token);

      await bluebird.delay(200);
    }),
  );
};

module.exports = getMissingTokens;
