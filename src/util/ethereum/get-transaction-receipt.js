const web3 = require('./web3');

const getTransactionReceipt = async transactionHash => {
  const web3Wrapper = web3.getWrapper();
  const receipt = await web3Wrapper.getTransactionReceiptIfExistsAsync(
    transactionHash,
  );

  return receipt;
};

module.exports = getTransactionReceipt;
