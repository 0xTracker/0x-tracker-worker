const _ = require('lodash');
const mongoose = require('mongoose');

const { getModel } = require('../model');
const { JOB, QUEUE } = require('../constants');
const createDocument = require('../index/fills/create-document');
const elasticsearch = require('../util/elasticsearch');
const getIndexName = require('../index/get-index-name');

const indexFillProtocolFee = async (job, { logger }) => {
  const { fillId, protocolFee } = job.data;

  if (!mongoose.Types.ObjectId.isValid(fillId)) {
    throw new Error(`Invalid fillId: ${fillId}`);
  }

  if (!_.isFinite(protocolFee)) {
    throw new Error(`Invalid value: ${protocolFee}`);
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
        protocolFeeUSD: protocolFee,
        updatedAt: new Date(Date.now()).toISOString(),
      },
      upsert: createDocument(fill),
    },
  });

  logger.success(`indexed fill protocol fee: ${fillId}`);
};

module.exports = {
  fn: indexFillProtocolFee,
  jobName: JOB.INDEX_FILL_PROTOCOL_FEE,
  queueName: QUEUE.FILL_INDEXING,
};
