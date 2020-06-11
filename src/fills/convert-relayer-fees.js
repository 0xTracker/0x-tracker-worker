const { JOB, QUEUE } = require('../constants');
const { publishJob } = require('../queues');

const convertRelayerFees = async (fillId, delay) => {
  await publishJob(
    QUEUE.FILL_PROCESSING,
    JOB.CONVERT_RELAYER_FEES,
    {
      fillId,
    },
    {
      delay,
      jobId: `convert-relayer-fees-${fillId}`,
    },
  );
};

module.exports = convertRelayerFees;
