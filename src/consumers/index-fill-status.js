const mongoose = require('mongoose');
const signale = require('signale');

const { FILL_STATUS, JOB, QUEUE } = require('../constants');
const elasticsearch = require('../util/elasticsearch');

const logger = signale.scope('index fill status');

const indexFillStatus = async job => {
  const { fillId, status } = job.data;

  if (!mongoose.Types.ObjectId.isValid(fillId)) {
    throw new Error(`Invalid fillId: ${fillId}`);
  }

  if (status !== FILL_STATUS.FAILED && status !== FILL_STATUS.SUCCESSFUL) {
    throw new Error(`Invalid status: ${status}`);
  }

  const exists = await elasticsearch
    .getClient()
    .exists({ id: fillId, index: 'fills', _source: false });
  const indexed = exists.body;

  if (!indexed) {
    throw new Error(`Could not update status of fill: ${fillId}`);
  }

  await elasticsearch.getClient().update({
    id: fillId,
    index: 'fills',
    body: {
      doc: {
        status,
        updatedAt: Date.now(),
      },
    },
  });

  logger.success(`indexed fill status: ${fillId}`);
};

module.exports = {
  fn: indexFillStatus,
  jobName: JOB.INDEX_FILL_STATUS,
  queueName: QUEUE.FILL_INDEXING,
};
