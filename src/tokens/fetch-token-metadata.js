const { JOB, QUEUE } = require('../constants');
const { publishJob } = require('../queues');

const fetchTokenMetadata = async (tokenAddress, tokenType, delay) => {
  publishJob(
    QUEUE.TOKEN_METADATA,
    JOB.FETCH_TOKEN_METADATA,
    {
      tokenAddress,
      tokenType,
    },
    {
      delay,
    },
  );
};

module.exports = fetchTokenMetadata;
