const getPricesForFill = require('./get-prices-for-fill');
const persistAssetPrices = require('./persist-asset-prices');
const persistTokenPrices = require('./persist-token-prices');
const withTransaction = require('../../util/with-transaction');

const priceFill = async fill => {
  const tokenPrices = getPricesForFill(fill);

  if (tokenPrices === null) {
    throw new Error(`Unable to derive prices of fill ${fill._id}`);
  }

  await withTransaction(async session => {
    await persistAssetPrices(tokenPrices, fill, session);

    if (fill.relayerId !== undefined && fill.relayerId !== null) {
      // If this trade is verified (associated with a known relayer) then update
      // token prices where applicable.
      await persistTokenPrices(tokenPrices, fill, session);
    }
  });
};

module.exports = priceFill;
