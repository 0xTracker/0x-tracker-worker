const signale = require('signale');

const { FILL_PRICING_STATUS } = require('../../constants');

const logger = signale.scope('derive fill prices > persist asset price');

const persistAssetPrice = async (tokenPrice, fill, session) => {
  fill.assets
    .filter(asset => asset.tokenAddress === tokenPrice.tokenAddress)
    .forEach(asset => {
      asset.set({ 'price.USD': tokenPrice.price.USD });
      logger.debug(
        `set price of ${tokenPrice.tokenAddress} to ${tokenPrice.price.USD} on fill ${fill._id}`,
      );
    });

  fill.set('pricingStatus', FILL_PRICING_STATUS.PRICED);

  await fill.save({ session });
};

module.exports = persistAssetPrice;
