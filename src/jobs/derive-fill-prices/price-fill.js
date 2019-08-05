const signale = require('signale');

const deriveTokenPriceFromFill = require('./derive-token-price-from-fill');
const markFillAsUnpriceable = require('./mark-fill-as-unpriceable');
const persistAssetPrice = require('./persist-asset-price');
const persistTokenPrice = require('./persist-token-price');
const withTransaction = require('../../util/with-transaction');

const logger = signale.scope('derive fill prices > price fill');

const priceFill = async fill => {
  const tokenPrice = deriveTokenPriceFromFill(fill);

  if (tokenPrice === null) {
    // If a token price cannot be derived from the fill then this fill
    // is unpriceable and should be marked as such to avoid future processing.
    await markFillAsUnpriceable(fill._id);
    logger.info(`marked fill ${fill._id} as unpriceable`);

    return;
  }

  await withTransaction(async session => {
    // Update the priced asset on this fill and mark the fill as priced
    await persistAssetPrice(tokenPrice, fill, session);

    if (fill.relayerId !== undefined && fill.relayerId !== null) {
      // If this trade is verified (associated with a known relayer) then update
      // the last trade and price of the token.
      await persistTokenPrice(tokenPrice, fill, session);
    }
  });

  logger.success(`priced fill ${fill._id}`);
};

module.exports = priceFill;
