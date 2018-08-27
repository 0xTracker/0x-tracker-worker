const { find, isArray } = require('lodash');

const getAllRelayers = require('../relayers/get-all-relayers');

const getRelayerForFill = ({ feeRecipient, takerAddress }) => {
  const relayers = getAllRelayers();

  return (
    find(
      relayers,
      relayer =>
        (isArray(relayer.takerAddresses) &&
          relayer.takerAddresses.includes(takerAddress)) ||
        (isArray(relayer.feeRecipients) &&
          relayer.feeRecipients.includes(feeRecipient)),
    ) || null
  );
};

module.exports = getRelayerForFill;
