const bluebird = require('bluebird');
const signale = require('signale');

const Token = require('../../model/token');

const logger = signale.scope('measure fills > persist token prices');

const persistTokenPrices = async (tokenPrices, fill, session) => {
  await bluebird.mapSeries(Object.keys(tokenPrices), async tokenAddress => {
    const price = tokenPrices[tokenAddress];
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
            lastPrice: price,
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
