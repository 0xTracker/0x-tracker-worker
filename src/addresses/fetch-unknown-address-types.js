const _ = require('lodash');
const { getModel } = require('../model');
const fetchAddressType = require('./fetch-address-type');

const determineUnknownAddresses = async addresses => {
  const AddressMetadata = getModel('AddressMetadata');

  const existingMetadata = await AddressMetadata.find({
    address: { $in: addresses },
  });

  return addresses.filter(address => {
    const metadata = existingMetadata.find(x => x.address === address);

    if (metadata === undefined || metadata.isContract === undefined) {
      return true;
    }

    return false;
  });
};

const fetchUnknownAddressTypes = async addresses => {
  const dedupedAddresses = _.uniq(addresses);
  const unknownAddresses = await determineUnknownAddresses(dedupedAddresses);

  if (unknownAddresses.length === 0) {
    return;
  }

  await Promise.all(unknownAddresses.map(address => fetchAddressType(address)));
};

module.exports = fetchUnknownAddressTypes;
