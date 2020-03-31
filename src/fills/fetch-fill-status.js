const { JOB, QUEUE } = require('../constants');
const { publishJob } = require('../queues');

const fetchFillStatus = async (fill, delay) => {
  await publishJob(
    QUEUE.FILL_PROCESSING,
    JOB.FETCH_FILL_STATUS,
    {
      fillId: fill._id,
      transactionHash: fill.transactionHash,
    },
    {
      delay,
    },
  );
};

module.exports = fetchFillStatus;
