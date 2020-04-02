const { JOB, QUEUE } = require('../constants');
const { publishJob } = require('../queues');

const indexFill = async (fillId, delay) => {
  await publishJob(
    QUEUE.FILL_INDEXING,
    JOB.INDEX_FILL,
    {
      fillId,
    },
    {
      delay,
      jobId: `index-fill-${fillId}`,
    },
  );
};

module.exports = indexFill;
