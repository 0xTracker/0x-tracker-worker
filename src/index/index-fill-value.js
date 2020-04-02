const { JOB, QUEUE } = require('../constants');
const { publishJob } = require('../queues');

const indexFillValue = async (fill, value) => {
  await publishJob(
    QUEUE.FILL_INDEXING,
    JOB.INDEX_FILL_VALUE,
    {
      fillId: fill._id,
      relayerId: fill.relayerId,
      value,
    },
    { jobId: `index-fill-value-${fill._id}` },
  );
};

module.exports = indexFillValue;
