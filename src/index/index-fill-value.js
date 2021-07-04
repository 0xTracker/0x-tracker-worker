const { JOB, QUEUE } = require('../constants');
const getTradeCountContribution = require('../fills/get-trade-count-contribution');
const { publishJob } = require('../queues');

const indexFillValue = async (fill, value) => {
  const fillId = fill._id.toString();
  const tradeCountContribution = getTradeCountContribution(fill);

  await publishJob(
    QUEUE.INDEXING,
    JOB.INDEX_FILL_VALUE,
    {
      fillId,
      tradeValue: value * tradeCountContribution,
      value,
    },
    { jobId: `index-fill-value-${fillId}` },
  );
};

module.exports = indexFillValue;
