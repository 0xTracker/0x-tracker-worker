const { JOB, QUEUE } = require('../constants');
const { publishJob } = require('../queues');

const indexFillStatus = async (fillId, status, delay) => {
  await publishJob(
    QUEUE.FILL_INDEXING,
    JOB.INDEX_FILL_STATUS,
    {
      fillId,
      status,
    },
    { delay, jobId: `index-fill-status-${fillId}` },
  );
};

module.exports = indexFillStatus;
