const { JOB, QUEUE } = require('../constants');
const { publishJob } = require('../queues');

const fetchFillStatus = async (fill, delay) => {
  const fillId = fill._id.toString();

  await publishJob(
    QUEUE.FILL_PROCESSING,
    JOB.CONVERT_PROTOCOL_FEE,
    {
      fillId,
      fillDate: fill.date,
      protocolFee: fill.protocolFee,
    },
    {
      delay,
      jobId: `convert-protocol-fee-${fillId}`,
    },
  );
};

module.exports = fetchFillStatus;
