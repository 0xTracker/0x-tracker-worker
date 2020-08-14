const _ = require('lodash');
const resolveRelayer = require('../relayers/resolve-relayer');
const resolveApps = require('../apps/resolve-apps');

const APP_TYPE_TO_NUMBER = {
  relayer: 0,
  consumer: 1,
};

const applyAttributionsToFill = fill => {
  const relayer = resolveRelayer({
    affiliateAddress: fill.affiliateAddress,
    feeRecipient: fill.feeRecipient,
    senderAddress: fill.senderAddress,
    takerAddress: fill.taker,
  });

  const apps = resolveApps({
    affiliateAddress: fill.affiliateAddress,
    feeRecipientAddress: fill.feeRecipient,
    takerAddress: fill.taker,
  }).map(app => ({
    appId: app.id,
    type: APP_TYPE_TO_NUMBER[app.type],
  }));

  const fillWithAttributions = {
    ...fill,
    apps,
    relayerId: _.get(relayer, 'lookupId'),
  };

  return fillWithAttributions;
};

module.exports = applyAttributionsToFill;
