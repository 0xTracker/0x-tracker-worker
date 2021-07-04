const { JOB, QUEUE } = require('../constants');
const { publishJob } = require('../queues');

const convertRelayerFees = async (fillId, delay) => {
  await publishJob(
    QUEUE.PRICING,
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
