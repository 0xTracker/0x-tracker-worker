const web3 = require('./web3');

const getTransaction = async transactionHash => {
  const web3Wrapper = web3.getWrapper();

  const timeout = new Promise((resolve, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      reject(
        new Error(
          `Fetching transaction ${transactionHash} timed out after 10s`,
        ),
      );
    }, 10000);
  });

  const tx = await Promise.race([
    web3Wrapper.getTransaction(transactionHash),
    timeout,
  ]);

  return tx;
};

module.exports = getTransaction;
