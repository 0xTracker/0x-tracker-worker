const { getModel } = require('../../model');

const persistTransaction = async (transaction, options) => {
  const Transaction = getModel('Transaction');

  await Transaction.create([transaction], options);
};

module.exports = persistTransaction;
