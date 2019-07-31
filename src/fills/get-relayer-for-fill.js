const _ = require('lodash');

const getAllRelayers = require('../relayers/get-all-relayers');

const getRelayerForFill = ({ feeRecipient, takerAddress }) => {
  const relayers = getAllRelayers();
  const matchingRelayer = _.find(
    relayers,
    relayer =>
      _.includes(relayer.takerAddresses, takerAddress) ||
      _.includes(relayer.feeRecipients, feeRecipient),
  );

  return matchingRelayer || null;
};

module.exports = getRelayerForFill;
