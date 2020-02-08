const _ = require('lodash');
const mongoose = require('mongoose');
const signale = require('signale');

const { JOB, QUEUE } = require('../constants');
const elasticsearch = require('../util/elasticsearch');

const logger = signale.scope('index fill protocol fee');

const indexFillProtocolFee = async job => {
  const { fillId, protocolFee } = job.data;

  if (!mongoose.Types.ObjectId.isValid(fillId)) {
    throw new Error(`Invalid fillId: ${fillId}`);
  }

  if (!_.isFinite(protocolFee)) {
    throw new Error(`Invalid value: ${protocolFee}`);
  }

  const exists = await elasticsearch
    .getClient()
    .exists({ id: fillId, index: 'fills', _source: false });
  const indexed = exists.body;

  if (!indexed) {
    throw new Error(`Could not index protocol fee of fill: ${fillId}`);
  }

  await elasticsearch.getClient().update({
    id: fillId,
    index: 'fills',
    body: {
      doc: {
        protocolFeeUSD: protocolFee,
        updatedAt: new Date(Date.now()).toISOString(),
      },
    },
  });

  logger.success(`indexed fill protocol fee: ${fillId}`);
};

module.exports = {
  fn: indexFillProtocolFee,
  jobName: JOB.INDEX_FILL_PROTOCOL_FEE,
  queueName: QUEUE.FILL_INDEXING,
};
