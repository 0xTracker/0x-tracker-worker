const { FILL_PRICING_STATUS } = require('../../constants');
const formatTokenAmount = require('../../tokens/format-token-amount');

const persistAssetPrice = async (tokenPrice, fill, session) => {
  fill.assets
    .filter(asset => asset.tokenAddress === tokenPrice.tokenAddress)
    .forEach(asset => {
      if (asset.token === undefined) {
        throw new Error(
          `Token is missing for fill: ${asset.tokenAddress} on ${fill._id}`,
        );
      }

      const formattedAmount = formatTokenAmount(asset.amount, asset.token);

      asset.set({ 'value.USD': formattedAmount * tokenPrice.price.USD });
      asset.set({ 'price.USD': tokenPrice.price.USD });
    });

  fill.set('pricingStatus', FILL_PRICING_STATUS.PRICED);

  await fill.save({ session });
};

module.exports = persistAssetPrice;
