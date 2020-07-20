const _ = require('lodash');

const { FILL_STATUS } = require('../../constants');
const resolveRelayer = require('../../relayers/resolve-relayer');

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

  const fill = {
    _id: eventId,
    affiliateAddress: transaction.affiliateAddress,
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
