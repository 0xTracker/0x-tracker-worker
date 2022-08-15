const { getModel } = require('../model');

const checkTransactionExists = async txHash => {
  const existingTx = await getModel('Transaction').findOne({
    hash: txHash,
  });

  return existingTx !== null;
};

module.exports = checkTransactionExists;
