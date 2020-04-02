const { JOB, QUEUE } = require('../constants');
const { publishJob } = require('../queues');

const fetchFillStatus = async (fill, delay) => {
  await publishJob(
    QUEUE.FILL_PROCESSING,
    JOB.CONVERT_PROTOCOL_FEE,
    {
      fillId: fill._id,
      fillDate: fill.date,
      protocolFee: fill.protocolFee,
    },
    {
      delay,
      jobId: `convert-protocol-fee-${fill._id}`,
    },
  );
};

module.exports = fetchFillStatus;
