const _ = require('lodash');

const { FILL_STATUS } = require('../../constants');
const { resolveApps } = require('../../apps');
const resolveRelayer = require('../../relayers/resolve-relayer');

const APP_TYPE_TO_NUMBER = {
  relayer: 0,
  consumer: 1,
};

const buildFill = ({ eventData, eventId, protocolVersion, transaction }) => {
  const {
    assets,
    feeRecipient,
    fees,
    logIndex,
    maker,
    orderHash,
    protocolFee,
    senderAddress,
    taker,
  } = eventData;

  const relayer = resolveRelayer({
    affiliateAddress: transaction.affiliateAddress,
    feeRecipient,
    senderAddress,
    takerAddress: taker,
  });

  const apps = resolveApps({
    affiliateAddress: transaction.affiliateAddress,
    feeRecipientAddress: feeRecipient,
    takerAddress: taker,
  }).map(app => ({
    appId: app.id,
    type: APP_TYPE_TO_NUMBER[app.type],
  }));

  const fill = {
    _id: eventId,
    affiliateAddress: transaction.affiliateAddress,
    apps,
    assets,
    blockHash: transaction.blockHash,
    blockNumber: transaction.blockNumber,
    date: transaction.date,
    eventId,
    fees,
    feeRecipient,
    logIndex,
    maker,
    orderHash,
    protocolFee,
    protocolVersion,
    quoteDate: transaction.quoteDate,
    relayerId: _.get(relayer, 'lookupId'),
    senderAddress,
    status: FILL_STATUS.SUCCESSFUL, // TODO: Remove status from app, it no longer makes sense
    taker,
    transactionHash: transaction.hash,
  };

  return fill;
};

module.exports = buildFill;
