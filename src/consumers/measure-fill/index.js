const mongoose = require('mongoose');

const { JOB, QUEUE } = require('../../constants');
const { getModel } = require('../../model');
const checkIsFillMeasurable = require('./check-is-fill-measurable');
const measureFill = require('./measure-fill');

const consumer = async (job, { logger }) => {
  const { fillId } = job.data;

  if (!mongoose.Types.ObjectId.isValid(fillId)) {
    throw new Error(`Invalid fillId: ${fillId}`);
  }

  logger.info(`measuring fill: ${fillId}`);

  const fill = await getModel('Fill').findOne({ _id: fillId });

  if (fill === null) {
    throw new Error(`No fill found with the id: ${fillId}`);
  }

  if (fill.hasValue) {
    logger.info(`fill has already been measured: ${fill._id}`);
    return;
  }

  const isFillMeasurable = checkIsFillMeasurable(fill);

  if (!isFillMeasurable) {
    logger.info(`fill is not measurable: ${fill._id}`);
  }

  await measureFill(fill);
  logger.success(`measured fill: ${fill._id}`);
};

module.exports = {
  fn: consumer,
  jobName: JOB.MEASURE_FILL,
  queueName: QUEUE.PRICING,
};
