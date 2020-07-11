const { getModel } = require('../model');

const getTransactionByHash = async hash => {
  const tx = await getModel('Transaction').findOne({ hash });

  return tx || null;
};

module.exports = getTransactionByHash;
