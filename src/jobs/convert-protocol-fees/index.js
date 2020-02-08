const bluebird = require('bluebird');
const signale = require('signale');

const { ETH_TOKEN_DECIMALS } = require('../../constants');
const formatTokenAmount = require('../../tokens/format-token-amount');
const getConversionRate = require('../../rates/get-conversion-rate');
const getFillsWithUnconvertedProtocolFees = require('./get-fills-with-unconverted-protocol-fees');
const persistConvertedProtocolFee = require('./persist-converted-protocol-fee');
const withTimer = require('../../util/with-timer');

const logger = signale.scope('convert protocol fees');

const convertProtocolFees = async ({ batchSize }) => {
  const fills = await withTimer(
    logger,
    'Fetch fills with unconverted protocol fees',
    async () => getFillsWithUnconvertedProtocolFees(batchSize),
  );

  logger.info(`Found ${fills.length} fills with unconverted protocol fees`);

  if (fills.length === 0) {
    return;
  }

  await bluebird.each(fills, async fill => {
    const conversionRate = await withTimer(
      logger,
      `Fetch ETH conversion rate for ${fill.date}`,
      async () => getConversionRate('ETH', 'USD', fill.date),
    );

    if (conversionRate === undefined) {
      logger.warn(`Unable to fetch ETH conversion rate for ${fill.date}`);
      return;
    }

    const formattedFee = formatTokenAmount(
      fill.protocolFee,
      ETH_TOKEN_DECIMALS,
    );
    const convertedFee = formattedFee.times(conversionRate).toNumber();

    await persistConvertedProtocolFee(fill.id, convertedFee);
  });
};

module.exports = convertProtocolFees;
