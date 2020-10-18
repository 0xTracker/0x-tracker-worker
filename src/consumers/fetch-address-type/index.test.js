const consumer = require('.');
const { getModel } = require('../../model');
const {
  setupDb,
  tearDownDb,
  resetDb,
  mockLogger,
} = require('../../test-utils');

const fetchAddressType = consumer.fn;

const mockOptions = {
  logger: mockLogger,
};

beforeAll(async () => {
  await setupDb();
}, 30000);

afterEach(async () => {
  jest.clearAllMocks();
  await resetDb();
}, 30000);

afterAll(async () => {
  await tearDownDb();
}, 30000);

describe('consumers/fetch-address-type', () => {
  it('should consume address-processing queue', () => {
    expect(consumer.queueName).toBe('address-processing');
  });

  it('should consume fetch-address-type jobs', () => {
    expect(consumer.jobName).toBe('fetch-address-type');
  });

  it('should fetch type of contract address', async () => {
    await fetchAddressType(
      {
        data: { address: '0x41f8d14c9475444f30a80431c68cf24dc9a8369a' },
      },
      mockOptions,
    );

    const addressMetadata = await getModel('AddressMetadata').findOne({
      address: '0x41f8d14c9475444f30a80431c68cf24dc9a8369a',
    });

    expect(addressMetadata.isContract).toBe(true);
  });

  it('should fetch type of non-contract address', async () => {
    await fetchAddressType(
      {
        data: { address: '0x7e8aa9e33d8a95687f39b0eb6eae1cc3c010b101' },
      },
      mockOptions,
    );

    const addressMetadata = await getModel('AddressMetadata').findOne({
      address: '0x7e8aa9e33d8a95687f39b0eb6eae1cc3c010b101',
    });

    expect(addressMetadata.isContract).toBe(false);
  });

  it('should update existing AddressMetadata document if one exists', async () => {
    const addressMetadataBefore = await getModel('AddressMetadata').create({
      address: '0x7e8aa9e33d8a95687f39b0eb6eae1cc3c010b768',
    });

    expect(addressMetadataBefore.isContract).toBeUndefined();

    await fetchAddressType(
      {
        data: { address: '0x7e8aa9e33d8a95687f39b0eb6eae1cc3c010b101' },
      },
      mockOptions,
    );

    const addressMetadataAfter = await getModel('AddressMetadata').findOne({
      address: '0x7e8aa9e33d8a95687f39b0eb6eae1cc3c010b101',
    });

    expect(addressMetadataAfter.isContract).toBe(false);
  });
});
