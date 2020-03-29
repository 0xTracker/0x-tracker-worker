const _ = require('lodash');
const moment = require('moment');
const mongoose = require('mongoose');
const signale = require('signale');

const { ETH_TOKEN_DECIMALS, JOB, QUEUE } = require('../../constants');
const formatTokenAmount = require('../../tokens/format-token-amount');
const getConversionRate = require('../../rates/get-conversion-rate');
const indexProtocolFee = require('../../index/index-protocol-fee');
const persistConvertedProtocolFee = require('./persist-converted-protocol-fee');
const withTransaction = require('../../util/with-transaction');

const logger = signale.scope('convert protocol fees');

const convertProtocolFee = async job => {
  const { fillDate, fillId, protocolFee } = job;

  logger.info(`converting protocol fee for fill: ${fillId}`);

  if (!mongoose.Types.ObjectId.isValid(fillId)) {
    throw new Error(`Invalid fillId: ${fillId}`);
  }

  if (!moment(fillDate).isValid()) {
    throw new Error(`Invalid fillDate: ${fillDate}`);
  }

  if (!_.isFinite(protocolFee)) {
    throw new Error(`Invalid protocolFee: ${protocolFee}`);
  }

  const conversionRate = await getConversionRate('ETH', 'USD', fillDate);

  if (conversionRate === undefined) {
    throw new Error(`Unable to fetch ETH conversion rate for ${fillDate}`);
  }

  const formattedFee = formatTokenAmount(protocolFee, ETH_TOKEN_DECIMALS);
  const convertedFee = formattedFee.times(conversionRate).toNumber();

  // Use a database transaction to ensure consistency
  await withTransaction(async session => {
    await persistConvertedProtocolFee(fillId, convertedFee, session);
    await indexProtocolFee(fillId, convertedFee);
  });

  logger.info(`converted protocol fee for fill: ${fillId}`);
};

module.exports = {
  fn: convertProtocolFee,
  jobName: JOB.CONVERT_PROTOCOL_FEE,
  queueName: QUEUE.FILL_PROCESSING,
};
