const _ = require('lodash');

const formatTokenAmount = require('../../tokens/format-token-amount');
const getBaseToken = require('../../tokens/get-base-token');
const getConversionRate = require('../../rates/get-conversion-rate');
const isBaseToken = require('../../tokens/is-base-token');

const convertMultiAssetFees = async (fill, logger) => {
  const { fees } = fill;

  if (_.isNil(fees) || fees.length === 0) {
    throw new Error(`Fill does not have any fees to convert: ${fill._id}`);
  }

  if (!fees.every(fee => isBaseToken(fee.tokenAddress))) {
    logger.warn(`Fill has fees which are not base tokens: ${fill._id}`);

    return false;
  }

  const tokens = _(fees)
    .map(fee => fee.tokenAddress)
    .uniq()
    .map(tokenAddress => getBaseToken(tokenAddress))
    .value();

  const rates = await Promise.all(
    tokens.map(async token => {
      const rate = await getConversionRate(token.symbol, 'USD', fill.date);

      if (rate === undefined) {
        throw new Error(
          `Unable to fetch USD ${token.symbol} converstion rate for ${fill.date}`,
        );
      }

      return { rate, token };
    }),
  );

  fees.forEach(fee => {
    const { rate, token } = rates.find(
      r => r.token.address === fee.tokenAddress,
    );
    const formattedAmount = formatTokenAmount(fee.amount.token, token.decimals);
    const usdAmount = formattedAmount * rate;

    fee.set('amount.USD', usdAmount);
  });

  rates.forEach(({ rate, token }) => {
    fill.set(`rates.${token.symbol}.USD`, rate);
  });

  await fill.save();

  return true;
};

module.exports = convertMultiAssetFees;
