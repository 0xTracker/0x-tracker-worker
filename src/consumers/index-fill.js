const mongoose = require('mongoose');

const { JOB, QUEUE } = require('../constants');
const { getModel } = require('../model');
const elasticsearch = require('../util/elasticsearch');
const fillsIndex = require('../index/fills');
const getIndexName = require('../index/get-index-name');

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

  await elasticsearch.getClient().index({
    id: fill._id,
    index: getIndexName('fills'),
    body: fillsIndex.createDocument(fill),
  });

  logger.info(`indexed fill: ${fillId}`);
};

module.exports = {
  fn: indexFill,
  jobName: JOB.INDEX_FILL,
  queueName: QUEUE.FILL_INDEXING,
};
