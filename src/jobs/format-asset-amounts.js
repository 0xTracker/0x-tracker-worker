const signale = require('signale');

const { getToken } = require('../tokens/token-cache');
const Fill = require('../model/fill');
const formatTokenAmount = require('../tokens/format-token-amount');

const logger = signale.scope('format asset amounts');

const formatAssetAmounts = async ({ batchSize }) => {
  logger.time('fetch batch of fills');
  const fills = await Fill.find({
    assets: { $elemMatch: { formattedAmount: null, tokenResolved: true } },
  }).limit(batchSize);
  logger.timeEnd('fetch batch of fills');

  if (fills.length === 0) {
    logger.info('no fills were found without formatted amounts');
  }

  await Promise.all(
    fills.map(async fill => {
      fill.assets.forEach(asset => {
        if (asset.formattedAmount === null && asset.tokenResolved) {
          const token = getToken(asset.tokenAddress);
          const formattedAmount = formatTokenAmount(asset.amount, token);

          asset.set({ formattedAmount });
        }
      });

      if (fill.isModified()) {
        await fill.save();

        logger.success(`assets were formatted for fill: ${fill._id}`);
      } else {
        logger.warn(`no assets were formatted for fill: ${fill._id}`);
      }
    }),
  );
};

module.exports = formatAssetAmounts;
