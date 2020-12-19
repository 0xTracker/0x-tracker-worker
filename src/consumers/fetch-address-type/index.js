const _ = require('lodash');

const { JOB, QUEUE } = require('../../constants');
const { getModel } = require('../../model');
const { getWrapper } = require('../../util/ethereum/web3');

const fetchAddressType = async (job, { logger }) => {
  const { address } = job.data;

  if (_.isEmpty(address)) {
    throw new Error('Job data is missing address');
  }

  logger.info(`fetching address type: ${address}`);

  const code = await getWrapper().getCode(address);
  const isContract = code !== '0x' && !_.isEmpty(code);

  await getModel('AddressMetadata').updateOne(
    {
      address,
    },
    {
      address,
      isContract,
    },
    { upsert: true },
  );

  logger.info(`fetched address type: ${address}`);
};

module.exports = {
  fn: fetchAddressType,
  jobName: JOB.FETCH_ADDRESS_TYPE,
  queueName: QUEUE.ADDRESS_PROCESSING,
};
