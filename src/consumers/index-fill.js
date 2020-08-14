const mongoose = require('mongoose');

const { JOB, QUEUE } = require('../constants');
const { getModel } = require('../model');
const fillsIndex = require('../index/fills');
const elasticsearch = require('../util/elasticsearch');

const indexFill = async (job, { logger }) => {
  const { fillId } = job.data;

  if (!mongoose.Types.ObjectId.isValid(fillId)) {
    throw new Error(`Invalid fillId: ${fillId}`);
  }

  logger.info(`indexing fill: ${fillId}`);

  const fill = await getModel('Fill').findOne({ _id: fillId });

  if (fill === null) {
    throw new Error(`No fill found with the id: ${fillId}`);
  }

  await elasticsearch.getClient().index({
    id: fill._id,
    index: 'fills',
    body: fillsIndex.createDocument(fill),
  });

  logger.success(`indexed fill: ${fillId}`);
};

module.exports = {
  fn: indexFill,
  jobName: JOB.INDEX_FILL,
  queueName: QUEUE.FILL_INDEXING,
};
