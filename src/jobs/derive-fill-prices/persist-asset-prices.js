const signale = require('signale');

const { FILL_PRICING_STATUS } = require('../../constants');

const logger = signale.scope('persist asset prices');

const persistAssetPrices = async (tokenPrices, fill, session) => {
  fill.assets.forEach(asset => {
    const tokenPrice = tokenPrices.find(
      ({ tokenAddress }) => tokenAddress === asset.tokenAddress,
    );

    if (tokenPrice !== undefined) {
      asset.set({ 'price.USD': tokenPrice.price.USD });
      logger.debug(
        `set price of ${tokenPrice.tokenAddress} to ${tokenPrice.price.USD} on ${fill._id}`,
      );
    }
  });

  fill.set('pricingStatus', FILL_PRICING_STATUS.PRICED);

  await fill.save({ session });
};

module.exports = persistAssetPrices;
