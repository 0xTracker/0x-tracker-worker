const bluebird = require('bluebird');

const web3 = require('./web3');

const getTransactionReceipt = async transactionHash => {
  const web3GetReceipt = bluebird.promisify(
    web3.getClient().eth.getTransactionReceipt,
  );
  const receipt = await web3GetReceipt(transactionHash);

  return receipt;
};

module.exports = getTransactionReceipt;
