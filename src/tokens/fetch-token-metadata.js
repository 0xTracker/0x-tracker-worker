const { JOB, QUEUE } = require('../constants');
const { publishJob } = require('../queues');

const fetchTokenMetadata = async (tokenAddress, tokenType, delay) => {
  publishJob(
    QUEUE.TOKEN_PROCESSING,
    JOB.FETCH_TOKEN_METADATA,
    {
      tokenAddress,
      tokenType,
    },
    {
      delay,
      jobId: `fetch-token-metadata-${tokenAddress}`,
    },
  );
};

module.exports = fetchTokenMetadata;
