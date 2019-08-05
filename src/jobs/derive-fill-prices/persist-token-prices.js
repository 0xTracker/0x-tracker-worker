const bluebird = require('bluebird');
const signale = require('signale');

const Token = require('../../model/token');

const logger = signale.scope('set token prices');

const persistTokenPrices = async (tokenPrices, fill, session) => {
  // Updates must be done in sequence due to WriteConflict errors arising from
  // parallel commands attached to a transaction session.
  await bluebird.mapSeries(tokenPrices, async ({ price, tokenAddress }) => {
    const result = await Token.updateOne(
      {
        address: tokenAddress,
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
            lastPrice: price.USD,
          },
        },
      },
      { session },
    );

    if (result.nModified > 0) {
      logger.debug(`updated price of token ${tokenAddress}`);
    }
  });
};

module.exports = persistTokenPrices;
