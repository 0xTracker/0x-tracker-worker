const _ = require('lodash');
const signale = require('signale');

const { getToken } = require('../tokens/token-cache');
const { FILL_ACTOR } = require('../constants');
const Fill = require('../model/fill');

const logger = signale.scope('migrate assets');

const buildAssets = fill => {
  const makerToken = getToken(fill.makerToken.toString());
  const takerToken = getToken(fill.takerToken.toString());
  const makerPrice = _.get(fill, 'conversions.USD.makerPrice');
  const takerPrice = _.get(fill, 'conversions.USD.makerPrice');

  return [
    {
      actor: FILL_ACTOR.MAKER,
      amount: fill.makerAmount,
      price:
        makerPrice !== undefined
          ? {
              USD: makerPrice,
            }
          : undefined,
      tokenAddress: fill.makerToken,
      tokenId: _.get(fill, 'makerAsset.tokenId'),
      tokenResolved: makerToken !== undefined,
    },
    {
      actor: FILL_ACTOR.TAKER,
      amount: fill.takerAmount,
      price:
        takerPrice !== undefined
          ? {
              USD: takerPrice,
            }
          : undefined,
      tokenAddress: fill.takerToken,
      tokenId: _.get(fill, 'takerAsset.tokenId'),
      tokenResolved: takerToken !== undefined,
    },
  ];
};

const migrateAssets = async ({ batchSize }) => {
  logger.time('fetch batch of fills');
  const fills = await Fill.find({
    assetsMigrated: { $in: [null, false] },
  }).limit(batchSize);
  logger.timeEnd('fetch batch of fills');

  logger.info(`found ${fills.length} fills without assets migrated`);

  if (fills.length === 0) {
    return;
  }

  await Promise.all(
    fills.map(async fill => {
      fill.set({ assets: buildAssets(fill), assetsMigrated: true });
      await fill.save();
      logger.success(`migrated assets for fill ${fill._id}`);
    }),
  );
};

module.exports = migrateAssets;
