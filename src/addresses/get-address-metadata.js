const { getModel } = require('../model');

const getAddressMetadata = async address => {
  const AddressMetadata = getModel('AddressMetadata');
  const metadata = await AddressMetadata.findOne({ address });

  return metadata;
};

module.exports = getAddressMetadata;
