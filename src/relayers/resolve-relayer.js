const _ = require('lodash');

const getAllRelayers = require('../relayers/get-all-relayers');

const resolveRelayer = metadata => {
  const {
    affiliateAddress,
    feeRecipient,
    senderAddress,
    takerAddress,
  } = metadata;

  const relayers = getAllRelayers();
  const matchingRelayer = _.find(
    relayers,
    relayer =>
      _.includes(relayer.takerAddresses, takerAddress) ||
      _.includes(relayer.feeRecipients, feeRecipient) ||
      _.includes(relayer.senderAddresses, senderAddress),
  );

  // TODO: Remove this temporary hack once apps feature is in place
  if (
    (affiliateAddress === '0x86003b044f70dac0abc80ac8957305b6370893ed' && // Matcha
      feeRecipient === '0x1000000000000000000000000000000000000011') || // 0x Team 0xAPI
    (affiliateAddress === '0x86003b044f70dac0abc80ac8957305b6370893ed' && // Matcha
      matchingRelayer === undefined)
  ) {
    return relayers.matcha;
  }
  
  // TODO: Remove this temporary hack once apps feature is in place
  if (
    (affiliateAddress === '0xa258b39954cef5cb142fd567a46cddb31a670124' && // RADAR RELAY
      feeRecipient === '0x0000000000000000000000000000000000000000') || // RADAR 0xAPI
    (affiliateAddress === '0xa258b39954cef5cb142fd567a46cddb31a670124' && // RADAR RELAY
      matchingRelayer === undefined)
  ) {
    return relayers.radarRelay;
  }

  return matchingRelayer || null;
};

module.exports = resolveRelayer;
