const { FILL_PRICING_STATUS } = require('../../constants');
const { getToken } = require('../../tokens/token-cache');
const formatTokenAmount = require('../../tokens/format-token-amount');

const persistAssetPrice = async (tokenPrice, fill, session) => {
  fill.assets
    .filter(asset => asset.tokenAddress === tokenPrice.tokenAddress)
    .forEach(asset => {
      const token = getToken(asset.tokenAddress);

      if (token === undefined) {
        throw new Error(
          `Unable to find token ${asset.tokenAddress} for fill ${fill._id}`,
        );
      }

      const formattedAmount = formatTokenAmount(asset.amount, token);

      asset.set({ 'value.USD': formattedAmount * tokenPrice.price.USD });
      asset.set({ 'price.USD': tokenPrice.price.USD });
    });

  fill.set('pricingStatus', FILL_PRICING_STATUS.PRICED);

  await fill.save({ session });
};

module.exports = persistAssetPrice;
