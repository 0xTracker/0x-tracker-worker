const { UnsupportedProtocolError } = require('../errors');
const getV1AssetsForEvent = require('./get-v1-assets-for-event');
const getV2AssetsForEvent = require('./get-v2-assets-for-event');

const getAssets = event => {
  const { protocolVersion } = event;

  if (protocolVersion === 1) {
    return getV1AssetsForEvent(event);
  }

  if (protocolVersion === 2 || protocolVersion === 3) {
    return getV2AssetsForEvent(event);
  }

  throw new UnsupportedProtocolError();
};

module.exports = getAssets;
