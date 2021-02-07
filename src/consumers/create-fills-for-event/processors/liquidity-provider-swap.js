const _ = require('lodash');
const { BigNumber } = require('@0x/utils');
const { FILL_ACTOR, FILL_TYPE, TOKEN_TYPE } = require('../../../constants');
const createFills = require('../../../fills/create-fills');
const createNewTokens = require('../../../tokens/create-new-tokens');
const Fill = require('../../../model/fill');
const withTransaction = require('../../../util/with-transaction');

const processLiquidityProviderSwapEvent = async (
  event,
  transaction,
  { logger },
) => {
  const eventId = event._id;

  /*
    We must assume that the job may be run multiple times due to errors, timeouts etc.
    If the fill has already been created then log a warning and bail.
  */
  const existingFill = await Fill.findOne({ eventId });
  if (existingFill !== null) {
    logger.warn(
      `fill for LiquidityProviderSwap event already exists: ${eventId}`,
    );
    return;
  }

  const newFill = {
    _id: event._id,
    affiliateAddress:
      transaction.affiliateAddress !== undefined
        ? transaction.affiliateAddress.toLowerCase()
        : undefined,
    assets: [
      {
        actor: FILL_ACTOR.MAKER,
        amount: new BigNumber(event.data.inputTokenAmount).toNumber(),
        bridgeAddress: event.data.provider.toLowerCase(),
        tokenAddress: event.data.inputToken.toLowerCase(),
      },
      {
        actor: FILL_ACTOR.TAKER,
        amount: new BigNumber(event.data.outputTokenAmount).toNumber(),
        tokenAddress: event.data.outputToken.toLowerCase(),
      },
    ],
    blockHash: transaction.blockHash.toLowerCase(),
    blockNumber: transaction.blockNumber,
    date: transaction.date,
    eventId: event._id,
    logIndex: event.logIndex,
    maker: event.data.provider.toLowerCase(),
    protocolVersion:
      transaction.date >= new Date('2021-01-25T00:00:00Z') ? 4 : 3,
    quoteDate: transaction.quoteDate,
    taker: event.data.recipient.toLowerCase(),
    transactionHash: transaction.hash.toLowerCase(),
    type: FILL_TYPE.LIQUIDITY_PROVIDER_SWAP,
  };

  /*
   * Create any tokens which haven't been seen before.
   */
  const uniqTokens = _(newFill.assets.map(asset => asset.tokenAddress))
    .uniq()
    .map(address => ({
      address,
      type: TOKEN_TYPE.ERC20,
    }))
    .value();

  await createNewTokens(uniqTokens);

  await withTransaction(async session => {
    await createFills(transaction, [newFill], { session });
  });

  logger.info(`created fill for LiquidityProviderSwap event: ${eventId}`);
};

module.exports = processLiquidityProviderSwapEvent;
