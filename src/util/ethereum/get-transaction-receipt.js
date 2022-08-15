const web3 = require('./web3');

const getTransactionReceipt = async transactionHash => {
  const web3Wrapper = web3.getWrapper();

  const timeout = new Promise((resolve, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      reject(
        new Error(
          `Fetching transaction receipt ${transactionHash} timed out after 10s`,
        ),
      );
    }, 10000);
  });

  const receipt = await Promise.race([
    web3Wrapper.getTransactionReceipt(transactionHash),
    timeout,
  ]);

  return receipt;
};

module.exports = getTransactionReceipt;
