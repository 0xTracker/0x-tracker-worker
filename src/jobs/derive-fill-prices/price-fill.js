const deriveTokenPriceFromFill = require('./derive-token-price-from-fill');
const indexTradedTokens = require('../../index/index-traded-tokens');
const markFillAsUnpriceable = require('./mark-fill-as-unpriceable');
const persistAssetPrice = require('./persist-asset-price');
const persistTokenPrice = require('./persist-token-price');
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
    // Update the priced asset on this fill and mark the fill as priced
    await persistAssetPrice(tokenPrice, fill, session);

    if (fill.relayerId !== undefined && fill.relayerId !== null) {
      // TODO: Remove this logic once token prices are pulled from Elasticsearch
      // If this trade is verified (associated with a known relayer) then update
      // the last trade and price of the token.
      await persistTokenPrice(tokenPrice, fill, session);
    }

    await indexTradedTokens(fill);
  });

  return true;
};

module.exports = priceFill;
