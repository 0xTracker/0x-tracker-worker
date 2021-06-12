const { JOB, QUEUE } = require('../constants');
const { publishJob } = require('../queues');

const indexProtocolFee = async (fillId, convertedFee) => {
  await publishJob(
    QUEUE.INDEXING,
    JOB.INDEX_FILL_PROTOCOL_FEE,
    {
      fillId,
      protocolFee: convertedFee,
    },
    { jobId: `index-protocol-fee-${fillId}` },
  );
};

module.exports = indexProtocolFee;
