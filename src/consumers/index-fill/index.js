const mongoose = require('mongoose');

const { JOB, QUEUE } = require('../../constants');
const { getModel } = require('../../model');
const populateAppFillsIndex = require('./populate-app-fills-index');
const populateFillsIndex = require('./populate-fills-index');

const indexFill = async (job, { logger }) => {
  const { fillId } = job.data;

  if (!mongoose.Types.ObjectId.isValid(fillId)) {
    throw new Error(`Invalid fillId: ${fillId}`);
  }

  logger.info(`indexing fill: ${fillId}`);

  const fill = await getModel('Fill')
    .findOne({ _id: fillId })
    .populate([
      { path: 'takerMetadata', select: 'isContract' },
      { path: 'transaction', select: 'from to' },
    ]);

  if (fill === null) {
    throw new Error(`No fill found with the id: ${fillId}`);
  }

  await populateFillsIndex(fill);
  await populateAppFillsIndex(fill);

  logger.info(`indexed fill: ${fillId}`);
};

module.exports = {
  fn: indexFill,
  jobName: JOB.INDEX_FILL,
  queueName: QUEUE.INDEXING,
};
