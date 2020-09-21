const { JOB, QUEUE } = require('../constants');
const { publishJob } = require('../queues');

const indexFillValue = async (fill, value) => {
  const fillId = fill._id.toString();

  await publishJob(
    QUEUE.FILL_INDEXING,
    JOB.INDEX_FILL_VALUE,
    {
      fillId,
      relayerId: fill.relayerId,
      value,
    },
    { jobId: `index-fill-value-${fillId}` },
  );
};

module.exports = indexFillValue;
