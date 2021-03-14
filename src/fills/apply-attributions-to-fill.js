const _ = require('lodash');
const resolveRelayer = require('../relayers/resolve-relayer');
const resolveAttributions = require('../attributions/resolve-attributions');
const { FILL_ACTOR } = require('../constants');

const ATTRIBUTION_TYPE_TO_NUMBER = {
  relayer: 0,
  consumer: 1,
  'liquidity-source': 2,
};

const applyAttributionsToFill = (fill, transaction) => {
  const relayer = resolveRelayer({
    affiliateAddress: fill.affiliateAddress,
    feeRecipient: fill.feeRecipient,
    senderAddress: fill.senderAddress,
    takerAddress: fill.taker,
  });

  const bridgeAddress = _.get(
    fill.assets.find(x => x.actor === FILL_ACTOR.MAKER),
    'bridgeAddress',
  );

  const attributions = _.sortBy(
    resolveAttributions({
      affiliateAddress: fill.affiliateAddress,
      bridgeAddress,
      feeRecipientAddress: fill.feeRecipient,
      senderAddress: fill.senderAddress,
      source: fill.source,
      takerAddress: fill.taker,
      transactionToAddress: transaction.to,
      tradeType: fill.type,
    }).map(attribution => ({
      entityId: attribution.id,
      type: ATTRIBUTION_TYPE_TO_NUMBER[attribution.type],
    })),
    x => x.type,
  );

  const fillWithAttributions = {
    ...fill,
    attributions,
    relayerId: _.get(relayer, 'lookupId'),
  };

  return fillWithAttributions;
};

module.exports = applyAttributionsToFill;
