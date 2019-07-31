const _ = require('lodash');
const bluebird = require('bluebird');
const signale = require('signale');

const Fill = require('../../model/fill');
const getPrices = require('./get-prices-for-fill');
const Token = require('../../model/token');
const withTransaction = require('../../util/with-transaction');

const logger = signale.scope('derive fill prices');

// TODO: Rewrite this job to support multi-asset fills
const deriveFillPrices = async ({ batchSize }) => {
  logger.time('fetch batch of fills');
  const fills = await Fill.find({
    hasValue: true,
    'prices.saved': false,
    assets: {
      $not: { $elemMatch: { tokenResolved: false } },
    },
  }).limit(batchSize);
  logger.timeEnd('fetch batch of fills');

  logger.info(`found ${fills.length} fills which need their prices derived`);

  if (fills.length === 0) {
    return;
  }

  await bluebird.mapSeries(fills, async fill => {
    const pricedAssets = getPrices(fill);

    if (pricedAssets === null) {
      logger.warn(`unable to derive prices for fill ${fill._id}`);
      return;
    }

    await withTransaction(async session => {
      // Set the price of all assets belonging to the fill
      await bluebird.mapSeries(pricedAssets, async pricedAsset => {
        await Fill.updateOne(
          { _id: fill._id },
          {
            $set: {
              'assets.$[asset].price': pricedAsset.price,
            },
          },
          {
            arrayFilters: [{ 'asset.tokenAddress': pricedAsset.tokenAddress }],
            session,
          },
        );

        logger.debug(
          `set price of ${pricedAsset.tokenAddress} to ${pricedAsset.price.USD} on ${fill._id}`,
        );
      });

      // Flag the fill as having its prices saved
      await Fill.updateOne(
        { _id: fill._id },
        { $set: { 'prices.saved': true } },
        { session },
      );

      // If this trade is verified (associated with a known relayer) then update
      // token prices where applicable.
      if (_.isNumber(fill.relayerId)) {
        await bluebird.mapSeries(
          pricedAssets,
          async ({ price, tokenAddress }) => {
            const result = await Token.updateOne(
              {
                address: tokenAddress,
                $or: [
                  {
                    'price.lastTrade.date': null,
                  },
                  {
                    'price.lastTrade.date': { $lt: fill.date },
                  },
                ],
              },
              {
                $set: {
                  price: {
                    lastTrade: { id: fill.id, date: fill.date },
                    lastPrice: price.USD,
                  },
                },
              },
              { session },
            );

            if (result.nModified > 0) {
              logger.debug(`updated price of token ${tokenAddress}`);
            }
          },
        );
      }
    });

    logger.success(`derived prices for fill ${fill._id}`);
  });
};

module.exports = deriveFillPrices;
