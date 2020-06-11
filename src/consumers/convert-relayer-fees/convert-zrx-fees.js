const { ZRX_TOKEN_DECIMALS } = require('../../constants');
const { getModel } = require('../../model');
const formatTokenAmount = require('../../tokens/format-token-amount');
const getConversionRate = require('../../rates/get-conversion-rate');

const convertAmount = (amount, conversionRate) =>
  formatTokenAmount(amount, ZRX_TOKEN_DECIMALS) * conversionRate;

const convertZrxFees = async fill => {
  const conversionRate = await getConversionRate('ZRX', 'USD', fill.date);

  if (conversionRate === undefined) {
    throw new Error(`Unable to fetch ZRX conversion rate for ${fill.date}`);
  }

  const makerFee = convertAmount(fill.makerFee, conversionRate);
  const takerFee = convertAmount(fill.takerFee, conversionRate);

  fill.set('conversions.USD.makerFee', makerFee);
  fill.set('conversions.USD.takerFee', takerFee);
  fill.set('rates.ZRX.USD', conversionRate);

  await getModel('Fill').updateOne(
    { _id: fill._id },
    {
      $set: {
        'conversions.USD.makerFee': makerFee,
        'conversions.USD.takerFee': takerFee,
        'rates.ZRX.USD': conversionRate,
      },
    },
  );

  return true;
};

module.exports = convertZrxFees;
