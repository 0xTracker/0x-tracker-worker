const _ = require('lodash');
const mongoose = require('mongoose');
const signale = require('signale');

const { JOB, QUEUE } = require('../constants');
const elasticsearch = require('../util/elasticsearch');

const logger = signale.scope('index fill fees');

const indexFillFees = async job => {
  const { fillId, makerFees, takerFees } = job.data;

  if (!mongoose.Types.ObjectId.isValid(fillId)) {
    throw new Error(`Invalid fillId: ${fillId}`);
  }

  if (!_.isFinite(makerFees)) {
    throw new Error(`Invalid makerFees: ${makerFees}`);
  }

  if (!_.isFinite(takerFees)) {
    throw new Error(`Invalid takerFees: ${takerFees}`);
  }

  const exists = await elasticsearch
    .getClient()
    .exists({ id: fillId, index: 'fills', _source: false });
  const indexed = exists.body;

  if (!indexed) {
    throw new Error(`Could not index fees of fill: ${fillId}`);
  }

  await elasticsearch.getClient().update({
    id: fillId,
    index: 'fills',
    body: {
      doc: {
        makerFees,
        takerFees,
        updatedAt: new Date(Date.now()).toISOString(),
      },
    },
  });

  logger.success(`indexed fill fees: ${fillId}`);
};

module.exports = {
  fn: indexFillFees,
  jobName: JOB.INDEX_FILL_FEES,
  queueName: QUEUE.FILL_INDEXING,
};
