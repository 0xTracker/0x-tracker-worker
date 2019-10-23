const getV1Assets = require('./get-v1-assets');
const getV2Assets = require('./get-v2-assets');

const getAssets = (eventArgs, protocolVersion) => {
  if (protocolVersion === 1) {
    return getV1Assets(eventArgs);
  }

  if (protocolVersion === 2) {
    return getV2Assets(eventArgs);
  }

  return undefined; // Unrecognised protocol version
};

module.exports = getAssets;
