const Bluebird = require('bluebird');
const mongoose = require('mongoose');

const { JOB, QUEUE } = require('../../constants');
const { getModel } = require('../../model');
const formatTokenAmount = require('../../tokens/format-token-amount');
const getBaseTokenDecimals = require('../../tokens/get-base-token-decimals');
const getBaseTokenSymbol = require('../../tokens/get-base-token-symbol');
const getConversionRate = require('../../rates/get-conversion-rate');
const isBaseToken = require('../../tokens/is-base-token');

const convertRelayerFees = async (job, { logger }) => {
  const { fillId } = job.data;

  logger.info(`converting relayer fees for fill: ${fillId}`);

  if (!mongoose.Types.ObjectId.isValid(fillId)) {
    throw new Error(`Invalid fillId: ${fillId}`);
  }

  const Fill = getModel('Fill');
  const fill = await Fill.findById(fillId);

  if (fill === null) {
    throw new Error(`Cannot find fill: ${fillId}`);
  }

  const { fees } = fill;
  const convertibleFees = fees.filter(fee => isBaseToken(fee.tokenAddress));

  if (convertibleFees.length === 0) {
    logger.warn(`fill does not have any convertible fees: ${fillId}`);
    return;
  }

  await Bluebird.each(convertibleFees, async fee => {
    const decimals = getBaseTokenDecimals(fee.tokenAddress);
    const amount = formatTokenAmount(fee.amount.token, decimals);
    const symbol = getBaseTokenSymbol(fee.tokenAddress);
    const conversionRate = await getConversionRate(symbol, 'USD', fill.date);

    if (conversionRate === undefined) {
      throw new Error(
        `Unable to fetch USD rate for ${symbol} on ${fill.date.toISOString()}`,
      );
    }

    const usdAmount = amount * conversionRate;

    fee.set('amount.USD', usdAmount);
  });

  if (fill.isModified()) {
    await fill.save();
  }

  logger.info(`converted relayer fees for fill: ${fillId}`);
};

module.exports = {
  fn: convertRelayerFees,
  jobName: JOB.CONVERT_RELAYER_FEES,
  queueName: QUEUE.FILL_PROCESSING,
};
