const { JOB, QUEUE } = require('../constants');
const { publishJob } = require('../queues');

const fetchAddressType = async address => {
  await publishJob(
    QUEUE.ADDRESS_PROCESSING,
    JOB.FETCH_ADDRESS_TYPE,
    {
      address,
    },
    {
      jobId: `fetch-address-type-${address}`,
    },
  );
};

module.exports = fetchAddressType;
