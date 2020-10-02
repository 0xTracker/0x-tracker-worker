const _ = require('lodash');
const { JOB, QUEUE } = require('../constants');
const { publishJob } = require('../queues');
const relayerRegistry = require('../relayers/relayer-registry');

const isOrderMatcher = relayerId => {
  const relayer = _(relayerRegistry)
    .values()
    .find({ lookupId: relayerId });

  return _.get(relayer, 'orderMatcher', false);
};

const calculateTradeCount = relayerId => {
  if (isOrderMatcher(relayerId)) {
    return 0.5;
  }

  return 1;
};

const indexFillTraders = async fill => {
  const fillId = fill._id.toString();
  const value = _.get(fill, 'conversions.USD.amount');
  const tradeCount = calculateTradeCount(fill.relayerId);

  publishJob(QUEUE.INDEXING, JOB.INDEX_FILL_TRADERS, {
    fillDate: fill.date,
    fillId,
    fillValue: value,
    maker: fill.maker,
    relayerId: fill.relayerId,
    taker: fill.taker,
    tradeCount,
    transactionHash: fill.transactionHash,
  });
};

module.exports = indexFillTraders;
