const _ = require('lodash');
const mongoose = require('mongoose');

const { JOB, QUEUE } = require('../constants');
const { getModel } = require('../model');
const createDocument = require('../index/fills/create-document');
const elasticsearch = require('../util/elasticsearch');
const relayerRegistry = require('../relayers/relayer-registry');

const isOrderMatcher = relayerId => {
  const relayer = _(relayerRegistry)
    .values()
    .find({ lookupId: relayerId });

  return _.get(relayer, 'orderMatcher', false);
};

const calculateTradeVolume = (value, relayerId) => {
  if (isOrderMatcher(relayerId)) {
    return value / 2;
  }

  return value;
};

const indexFillValue = async (job, { logger }) => {
  const { fillId, relayerId, value } = job.data;

  if (!mongoose.Types.ObjectId.isValid(fillId)) {
    throw new Error(`Invalid fillId: ${fillId}`);
  }

  if (!_.isFinite(value)) {
    throw new Error(`Invalid value: ${value}`);
  }

  const fill = await getModel('Fill')
    .findOne({ _id: fillId })
    .lean();

  if (fill === null) {
    throw new Error(`Could not find fill: ${fillId}`);
  }

  await elasticsearch.getClient().update({
    id: fillId,
    index: 'fills',
    body: {
      doc: {
        tradeVolume: calculateTradeVolume(value, relayerId),
        updatedAt: new Date(Date.now()).toISOString(),
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
  queueName: QUEUE.FILL_INDEXING,
};
