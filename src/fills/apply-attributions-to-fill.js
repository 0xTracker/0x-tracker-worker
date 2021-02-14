const _ = require('lodash');
const resolveRelayer = require('../relayers/resolve-relayer');
const resolveAttributions = require('../attributions/resolve-attributions');

const ATTRIBUTION_TYPE_TO_NUMBER = {
  relayer: 0,
  consumer: 1,
};

const applyAttributionsToFill = (fill, transaction) => {
  const relayer = resolveRelayer({
    affiliateAddress: fill.affiliateAddress,
    feeRecipient: fill.feeRecipient,
    senderAddress: fill.senderAddress,
    takerAddress: fill.taker,
  });

  const attributions = resolveAttributions({
    affiliateAddress: fill.affiliateAddress,
    feeRecipientAddress: fill.feeRecipient,
    senderAddress: fill.senderAddress,
    takerAddress: fill.taker,
    transactionToAddress: transaction.to,
  }).map(attribution => ({
    entityId: attribution.id,
    type: ATTRIBUTION_TYPE_TO_NUMBER[attribution.type],
  }));

  const fillWithAttributions = {
    ...fill,
    attributions,
    relayerId: _.get(relayer, 'lookupId'),
  };

  return fillWithAttributions;
};

module.exports = applyAttributionsToFill;
