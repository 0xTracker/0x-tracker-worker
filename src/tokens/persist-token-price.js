const signale = require('signale');

const Token = require('../model/token');

const logger = signale.scope('set token prices');

const persistTokenPrice = async (tokenPrice, fill, session) => {
  const result = await Token.updateOne(
    {
      address: tokenPrice.tokenAddress,
      $or: [
        {
          'price.lastTrade.date': null,
        },
        {
          'price.lastTrade.date': { $lt: fill.date },
        },
      ],
    },
    {
      $set: {
        price: {
          lastTrade: { id: fill.id, date: fill.date },
          lastPrice: tokenPrice.price.USD,
        },
      },
    },
    { session },
  );

  if (result.nModified > 0) {
    logger.debug(`updated price of token ${tokenPrice.tokenAddress}`);
  }
};

module.exports = persistTokenPrice;
