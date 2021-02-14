const { FILL_TYPE } = require('../../constants');
const createFills = require('../../fills/create-fills');
const createNewTokens = require('../../tokens/create-new-tokens');
const getEventData = require('../../events/get-event-data');
const getUniqTokens = require('./get-uniq-tokens');
const withTransaction = require('../../util/with-transaction');

const createFill = async (event, transaction) => {
  const eventData = getEventData(event);

  const fill = {
    _id: event._id,
    affiliateAddress: transaction.affiliateAddress,
    assets: eventData.assets,
    blockHash: transaction.blockHash,
    blockNumber: transaction.blockNumber,
    date: transaction.date,
    eventId: event._id,
    fees: eventData.fees,
    feeRecipient: eventData.feeRecipient,
    logIndex: eventData.logIndex,
    maker: eventData.maker,
    orderHash: eventData.orderHash,
    protocolFee: eventData.protocolFee,
    protocolVersion: event.protocolVersion,
    quoteDate: transaction.quoteDate,
    senderAddress: eventData.senderAddress,
    taker: eventData.taker,
    transactionHash: transaction.hash,
    type: FILL_TYPE.REGULAR,
  };

  const tokens = getUniqTokens(eventData.assets, eventData.fees);
  await createNewTokens(tokens);

  await withTransaction(async session => {
    await createFills(transaction, [fill], { session });
  });
};

module.exports = createFill;
