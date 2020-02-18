const bluebird = require('bluebird');

const Token = require('../../model/token');

const persistTokenPrices = async (tokenPrices, fill, session) => {
  await bluebird.mapSeries(Object.keys(tokenPrices), async tokenAddress => {
    const price = tokenPrices[tokenAddress];
    await Token.updateOne(
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
  });
};

module.exports = persistTokenPrices;
