const _ = require('lodash');
const mongoose = require('mongoose');

const { JOB, QUEUE } = require('../../constants');
const { getModel } = require('../../model');
const updateAppFillsIndex = require('./update-app-fills-index');
const updateFillsIndex = require('./update-fills-index');

const indexFillValue = async (job, { logger }) => {
  const { fillId, value } = job.data;

  if (!mongoose.Types.ObjectId.isValid(fillId)) {
    throw new Error(`Invalid fillId: ${fillId}`);
  }

  if (!_.isFinite(value)) {
    throw new Error(`Invalid value: ${value}`);
  }

  const fill = await getModel('Fill')
    .findOne({ _id: fillId })
    .populate([
      { path: 'takerMetadata', select: 'isContract' },
      { path: 'transaction', select: 'from to' },
    ])
    .lean();

  if (fill === null) {
    throw new Error(`Could not find fill: ${fillId}`);
  }

  await updateFillsIndex(fill, value);
  await updateAppFillsIndex(fill, value);

  logger.success(`indexed fill value: ${fillId}`);
};

module.exports = {
  fn: indexFillValue,
  jobName: JOB.INDEX_FILL_VALUE,
  queueName: QUEUE.INDEXING,
};
