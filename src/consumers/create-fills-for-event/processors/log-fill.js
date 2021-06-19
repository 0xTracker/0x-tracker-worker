const { FILL_TYPE } = require('../../../constants');
const createFills = require('../../../fills/create-fills');
const Fill = require('../../../model/fill');
const createNewTokens = require('../../../tokens/create-new-tokens');
const withTransaction = require('../../../util/with-transaction');
const getEventData = require('../../../events/get-event-data');
const getUniqTokens = require('../../../jobs/create-fills/get-uniq-tokens');

const processLogFillEvent = async (event, transaction, { logger }) => {
  const eventId = event._id;

  /*
    We must assume that the job may be run multiple times due to errors, timeouts etc.
    If the fill has already been created then log a warning and bail.
  */
  const existingFill = await Fill.findOne({ eventId });
  if (existingFill !== null) {
    logger.warn(`fill for LogFill event already exists: ${eventId}`);
    return;
  }

  const eventData = getEventData(event);

  const newFill = {
    _id: event._id,
    affiliateAddress: transaction.affiliateAddress,
    assets: eventData.assets,
    blockHash: transaction.blockHash.toLowerCase(),
    blockNumber: transaction.blockNumber,
    date: transaction.date,
    eventId: event._id,
    fees: eventData.fees,
    feeRecipient: eventData.feeRecipient.toLowerCase(),
    logIndex: eventData.logIndex,
    maker: eventData.maker.toLowerCase(),
    orderHash: eventData.orderHash,
    protocolVersion: event.protocolVersion,
    quoteDate: transaction.quoteDate,
    taker: eventData.taker.toLowerCase(),
    transactionHash: transaction.hash.toLowerCase(),
    type: FILL_TYPE.REGULAR,
  };

  /*
   * Create any tokens which haven't been seen before.
   */
  const uniqTokens = getUniqTokens(eventData.assets, eventData.fees);

  await createNewTokens(uniqTokens);

  await withTransaction(async session => {
    await createFills(transaction, [newFill], { session });
  });

  logger.info(`created fill for LogFill event: ${eventId}`);
};

module.exports = processLogFillEvent;
