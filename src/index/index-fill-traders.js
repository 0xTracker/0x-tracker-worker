const _ = require('lodash');
const { JOB, QUEUE, FILL_ATTRIBUTION_TYPE } = require('../constants');
const getTradeCountContribution = require('../fills/get-trade-count-contribution');
const { publishJob } = require('../queues');

const indexFillTraders = async fill => {
  const fillId = fill._id.toString();
  const value = _.get(fill, 'conversions.USD.amount');
  const tradeCountContribution = getTradeCountContribution(fill);

  publishJob(QUEUE.INDEXING, JOB.INDEX_FILL_TRADERS, {
    appIds: fill.attributions
      .filter(
        x =>
          x.type === FILL_ATTRIBUTION_TYPE.CONSUMER ||
          x.type === FILL_ATTRIBUTION_TYPE.RELAYER,
      )
      .map(x => x.entityId),
    fillDate: fill.date,
    fillId,
    fillValue: value,
    maker: fill.maker,
    taker: fill.taker,
    tradeCount: tradeCountContribution,
    transactionHash: fill.transactionHash,
  });
};

module.exports = indexFillTraders;
