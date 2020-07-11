const { getModel } = require('../../model');

const persistTransaction = async transaction => {
  const Transaction = getModel('Transaction');

  await Transaction.create(transaction);
};

module.exports = persistTransaction;
