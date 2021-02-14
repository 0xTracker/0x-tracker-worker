const _ = require('lodash');
const { BigNumber } = require('@0x/utils');
const { FILL_ACTOR, FILL_TYPE, TOKEN_TYPE } = require('../../../constants');
const createFills = require('../../../fills/create-fills');
const createNewTokens = require('../../../tokens/create-new-tokens');
const Fill = require('../../../model/fill');
const withTransaction = require('../../../util/with-transaction');

const processUniswapV2SwapEvent = async (event, transaction, { logger }) => {
  const eventId = event._id;

  /*
    We must assume that the job may be run multiple times due to errors, timeouts etc.
    If the fill has already been created then log a warning and bail.
  */
  const existingFill = await Fill.findOne({ eventId });
  if (existingFill !== null) {
    logger.warn(`fill for UniswapV2Swap event already exists: ${eventId}`);
    return;
  }

  /*
   * Finally, once all checks have passed, create the fill and associate token documents.
   */
  const fill = {
    _id: event._id,
    affiliateAddress:
      transaction.affiliateAddress !== undefined
        ? transaction.affiliateAddress.toLowerCase()
        : undefined,
    assets: [
      {
        actor: FILL_ACTOR.MAKER,
        amount: new BigNumber(event.data.makerAmount).toNumber(),
        tokenAddress: event.data.makerToken,

        /* 
          Uniswap V2 Bridge – this is a bit of a hack for tracking purposes and should
          be replaced longer-term with something better (e.g. liquidity source)
        */
        bridgeAddress: '0xdcd6011f4c6b80e470d9487f5871a0cba7c93f48',
      },
      {
        actor: FILL_ACTOR.TAKER,
        amount: new BigNumber(event.data.takerAmount).toNumber(),
        tokenAddress: event.data.takerToken.toLowerCase(),
      },
    ],
    blockHash: transaction.blockHash.toLowerCase(),
    blockNumber: transaction.blockNumber,
    date: transaction.date,
    eventId: event._id,
    logIndex: event.logIndex,
    maker: event.data.maker.toLowerCase(),
    protocolVersion:
      transaction.date >= new Date('2021-01-25T00:00:00Z') ? 4 : 3,
    quoteDate: transaction.quoteDate,
    taker: event.data.taker.toLowerCase(),
    transactionHash: transaction.hash.toLowerCase(),
    type: FILL_TYPE.UNISWAP_V2_SWAP,
  };

  const uniqTokens = _(fill.assets.map(asset => asset.tokenAddress))
    .uniq()
    .map(address => ({
      address,
      type: TOKEN_TYPE.ERC20,
    }))
    .value();

  await createNewTokens(uniqTokens);

  await withTransaction(async session => {
    await createFills(transaction, [fill], { session });
  });

  logger.info(`created fill for UniswapV2Swap event: ${eventId}`);
};

module.exports = processUniswapV2SwapEvent;
