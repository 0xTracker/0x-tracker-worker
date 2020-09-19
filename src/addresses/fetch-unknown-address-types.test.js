const { getModel } = require('../model');
const { publishJob } = require('../queues');
const fetchUnknownAddressTypes = require('./fetch-unknown-address-types');
const testUtils = require('../test-utils');

jest.mock('../queues');

beforeAll(async () => {
  await testUtils.setupDb();
}, 30000);

afterEach(async () => {
  jest.resetAllMocks();
  await testUtils.resetDb();
}, 30000);

afterAll(async () => {
  await testUtils.tearDownDb();
}, 30000);

describe('addresses/fetch-unknown-address-types', () => {
  it('should fetch type of all addresses when they are all unknown', async () => {
    await fetchUnknownAddressTypes([
      '0x14e56cf9e6257475f9b6310adc98865fc24d6504',
      '0xdcd6011f4c6b80e470d9487f5871a0cba7c93f48',
    ]);

    expect(publishJob).toHaveBeenCalledTimes(2);

    expect(publishJob).toHaveBeenCalledWith(
      'address-processing',
      'fetch-address-type',
      { address: '0x14e56cf9e6257475f9b6310adc98865fc24d6504' },
      {
        jobId: 'fetch-address-type-0x14e56cf9e6257475f9b6310adc98865fc24d6504',
      },
    );

    expect(publishJob).toHaveBeenCalledWith(
      'address-processing',
      'fetch-address-type',
      { address: '0xdcd6011f4c6b80e470d9487f5871a0cba7c93f48' },
      {
        jobId: 'fetch-address-type-0xdcd6011f4c6b80e470d9487f5871a0cba7c93f48',
      },
    );
  });

  it('should only fetch type of addresses which are not already known', async () => {
    const AddressMetadata = getModel('AddressMetadata');

    await AddressMetadata.create({
      address: '0x14e56cf9e6257475f9b6310adc98865fc24d6504',
      isContract: false,
    });

    await fetchUnknownAddressTypes([
      '0x14e56cf9e6257475f9b6310adc98865fc24d6504',
      '0xdcd6011f4c6b80e470d9487f5871a0cba7c93f48',
    ]);

    expect(publishJob).toHaveBeenCalledTimes(1);

    expect(publishJob).toHaveBeenCalledWith(
      'address-processing',
      'fetch-address-type',
      { address: '0xdcd6011f4c6b80e470d9487f5871a0cba7c93f48' },
      {
        jobId: 'fetch-address-type-0xdcd6011f4c6b80e470d9487f5871a0cba7c93f48',
      },
    );
  });

  it('should not fetch any address metadata when all types are already known', async () => {
    const AddressMetadata = getModel('AddressMetadata');

    await AddressMetadata.create([
      {
        address: '0x14e56cf9e6257475f9b6310adc98865fc24d6504',
        isContract: false,
      },
      {
        address: '0xdcd6011f4c6b80e470d9487f5871a0cba7c93f48',
        isContract: true,
      },
    ]);

    await fetchUnknownAddressTypes([
      '0x14e56cf9e6257475f9b6310adc98865fc24d6504',
      '0xdcd6011f4c6b80e470d9487f5871a0cba7c93f48',
    ]);

    expect(publishJob).toHaveBeenCalledTimes(0);
  });

  it('should fetch address type if address is known but type is not', async () => {
    const AddressMetadata = getModel('AddressMetadata');

    await AddressMetadata.create({
      address: '0x14e56cf9e6257475f9b6310adc98865fc24d6504',
      name: 'Tokenlon',
    });

    await fetchUnknownAddressTypes([
      '0x14e56cf9e6257475f9b6310adc98865fc24d6504',
    ]);

    expect(publishJob).toHaveBeenCalledTimes(1);

    expect(publishJob).toHaveBeenCalledWith(
      'address-processing',
      'fetch-address-type',
      { address: '0x14e56cf9e6257475f9b6310adc98865fc24d6504' },
      {
        jobId: 'fetch-address-type-0x14e56cf9e6257475f9b6310adc98865fc24d6504',
      },
    );
  });
});
