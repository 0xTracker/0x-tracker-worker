const _ = require('lodash');
const { BigNumber } = require('@0x/utils');
const { FILL_ACTOR, FILL_TYPE, TOKEN_TYPE } = require('../../../constants');
const createFills = require('../../../fills/create-fills');
const createNewTokens = require('../../../tokens/create-new-tokens');
const Fill = require('../../../model/fill');
const withTransaction = require('../../../util/with-transaction');

const processUniswapV3SwapEvent = async (event, transaction, { logger }) => {
  const eventId = event._id;

  /*
    We must assume that the job may be run multiple times due to errors, timeouts etc.
    If the fill has already been created then log a warning and bail.
  */
  const existingFill = await Fill.findOne({ eventId });
  if (existingFill !== null) {
    logger.warn(`fill for UniswapV3Swap event already exists: ${eventId}`);
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
          Uniswap V3 Bridge – this is a bit of a hack for tracking purposes and should
          be replaced longer-term with something better (e.g. liquidity source)
        */
        bridgeAddress: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
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
    protocolVersion: 4,
    quoteDate: transaction.quoteDate,
    taker: event.data.taker.toLowerCase(),
    transactionHash: transaction.hash.toLowerCase(),
    type: FILL_TYPE.UNISWAP_V3_SWAP,
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

  logger.info(`created fill for UniswapV3Swap event: ${eventId}`);
};

module.exports = processUniswapV3SwapEvent;
