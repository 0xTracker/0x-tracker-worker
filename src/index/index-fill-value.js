const { JOB, QUEUE } = require('../constants');
const { publishJob } = require('../queues');

const indexFillValue = async (fill, value) => {
  const fillId = fill._id.toString();

  await publishJob(
    QUEUE.INDEXING,
    JOB.INDEX_FILL_VALUE,
    {
      fillId,
      value,
    },
    { jobId: `index-fill-value-${fillId}` },
  );
};

module.exports = indexFillValue;
