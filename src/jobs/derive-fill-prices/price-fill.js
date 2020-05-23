const deriveTokenPriceFromFill = require('./derive-token-price-from-fill');
const indexTradedTokens = require('../../index/index-traded-tokens');
const markFillAsUnpriceable = require('./mark-fill-as-unpriceable');
const persistAssetPrice = require('./persist-asset-price');
const withTransaction = require('../../util/with-transaction');

const priceFill = async fill => {
  const tokenPrice = deriveTokenPriceFromFill(fill);

  if (tokenPrice === null) {
    // If a token price cannot be derived from the fill then this fill
    // is unpriceable and should be marked as such to avoid future processing.
    await markFillAsUnpriceable(fill._id);

    return false;
  }

  await withTransaction(async session => {
    await persistAssetPrice(tokenPrice, fill, session);
    await indexTradedTokens(fill);
  });

  return true;
};

module.exports = priceFill;
