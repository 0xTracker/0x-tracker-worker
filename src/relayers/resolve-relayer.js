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

  // TODO: Remove this temporary hack once attributions feature is in place
  if (
    (affiliateAddress === '0x86003b044f70dac0abc80ac8957305b6370893ed' && // Matcha
      feeRecipient === '0x1000000000000000000000000000000000000011') || // 0x API
    (affiliateAddress === '0x86003b044f70dac0abc80ac8957305b6370893ed' && // Matcha
      matchingRelayer === undefined)
  ) {
    return relayers.matcha;
  }

  // TODO: Remove this temporary hack once attributions feature is in place
  if (
    affiliateAddress === '0xa258b39954cef5cb142fd567a46cddb31a670124' && // RADAR RELAY
    matchingRelayer === undefined
  ) {
    return relayers.radarRelay;
  }

  // TODO: Remove this temporary hack once apps feature is in place
  if (
    (affiliateAddress === '0x11ededebf63bef0ea2d2d071bdf88f71543ec6fb' && // MetaMask
      feeRecipient === '0x1000000000000000000000000000000000000011') || // 0x API
    (affiliateAddress === '0x11ededebf63bef0ea2d2d071bdf88f71543ec6fb' && // MetaMask
      matchingRelayer === undefined)
  ) {
    return relayers.metamask;
  }

  // TODO: Remove this temporary hack once apps feature is in place
  if (
    (affiliateAddress === '0x322d58b9e75a6918f7e7849aee0ff09369977e08' && // DeFi Saver
      feeRecipient === '0x1000000000000000000000000000000000000011') || // 0x API
    (affiliateAddress === '0x322d58b9e75a6918f7e7849aee0ff09369977e08' && // DeFi Saver
      matchingRelayer === undefined)
  ) {
    return relayers.defiSaver;
  }

  return matchingRelayer || null;
};

module.exports = resolveRelayer;
