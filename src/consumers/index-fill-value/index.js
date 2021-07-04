const _ = require('lodash');
const mongoose = require('mongoose');

const { JOB, QUEUE } = require('../../constants');
const { getModel } = require('../../model');
const createDocument = require('../../index/fills/create-document');
const elasticsearch = require('../../util/elasticsearch');
const getIndexName = require('../../index/get-index-name');

const indexFillValue = async (job, { logger }) => {
  const { fillId, tradeValue, value } = job.data;

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

  await elasticsearch.getClient().update({
    id: fillId,
    index: getIndexName('fills'),
    body: {
      doc: {
        tradeVolume: tradeValue,
        value,
      },
      upsert: createDocument(fill),
    },
  });

  logger.success(`indexed fill value: ${fillId}`);
};

module.exports = {
  fn: indexFillValue,
  jobName: JOB.INDEX_FILL_VALUE,
  queueName: QUEUE.INDEXING,
};
