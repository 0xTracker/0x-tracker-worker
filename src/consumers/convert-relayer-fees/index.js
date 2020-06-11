const mongoose = require('mongoose');
const ms = require('ms');
const signale = require('signale');

const { JOB, QUEUE } = require('../../constants');
const { publishJob } = require('../../queues');
const convertMultiAssetFees = require('./convert-multi-asset-fees');
const convertZrxFees = require('./convert-zrx-fees');
const model = require('../../model');

const logger = signale.scope('convert relayer fees');

const convertRelayerFees = async job => {
  const { fillId } = job.data;

  logger.info(`converting relayer fees for fill: ${fillId}`);

  if (!mongoose.Types.ObjectId.isValid(fillId)) {
    throw new Error(`Invalid fillId: ${fillId}`);
  }

  const fill = await model.getModel('Fill').findById(fillId);

  const canConvert =
    fill.protocolVersion >= 3
      ? await convertMultiAssetFees(fill, logger)
      : await convertZrxFees(fill, logger);

  if (!canConvert) {
    publishJob(QUEUE.TOKEN_PROCESSING, JOB.CONVERT_RELAYER_FEES, job, {
      delay: ms('1 hour'),
    });

    return;
  }

  logger.info(`converted relayer fees for fill: ${fillId}`);
};

module.exports = {
  fn: convertRelayerFees,
  jobName: JOB.CONVERT_RELAYER_FEES,
  queueName: QUEUE.FILL_PROCESSING,
};
