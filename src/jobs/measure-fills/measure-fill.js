const bluebird = require('bluebird');

const { getToken } = require('../../tokens/token-cache');
const formatTokenAmount = require('../../tokens/format-token-amount');
const getConversionRate = require('../../rates/get-conversion-rate');
const getMeasurableActor = require('./get-measurable-actor');

const measureFill = async fill => {
  const measurableActor = getMeasurableActor(fill);

  let totalValue;

  bluebird.mapSeries(fill.assets, async asset => {
    if (asset.actor === measurableActor) {
      const token = getToken(asset.tokenAddress);

      if (token === undefined) {
        throw new Error(
          `Unable to fetch resolved token ${asset.tokenAddress} from token cache`,
        );
      }

      const amount = formatTokenAmount(asset.amount, token);
      const conversionRate = await getConversionRate(
        token.symbol,
        'USD',
        fill.date,
      );

      if (conversionRate === null) {
        throw new Error(
          `Unable to fetch USD price of ${token.symbol} on ${fill.date}`,
        );
      }

      asset.set('price.USD', conversionRate);

      totalValue += amount * conversionRate;
    }
  });

  fill.set('conversions.USD.amount', totalValue);
  await fill.save();

  return true;
};

module.exports = measureFill;
