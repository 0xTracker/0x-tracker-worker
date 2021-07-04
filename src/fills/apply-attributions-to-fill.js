const _ = require('lodash');
const resolveAttributions = require('../attributions/resolve-attributions');
const { FILL_ACTOR, FILL_ATTRIBUTION_TYPE } = require('../constants');

const ATTRIBUTION_TYPE_TO_NUMBER = {
  relayer: FILL_ATTRIBUTION_TYPE.RELAYER,
  consumer: FILL_ATTRIBUTION_TYPE.CONSUMER,
  'liquidity-source': FILL_ATTRIBUTION_TYPE.LIQUIDITY_SOURCE,
};

const applyAttributionsToFill = (fill, transaction) => {
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
  };

  return fillWithAttributions;
};

module.exports = applyAttributionsToFill;
