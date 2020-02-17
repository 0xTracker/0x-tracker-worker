const Token = require('../model/token');

const persistTokenPrice = async (tokenPrice, fill, session) => {
  await Token.updateOne(
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
};

module.exports = persistTokenPrice;
