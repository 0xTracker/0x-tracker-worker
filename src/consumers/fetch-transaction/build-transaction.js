const parseTransactionData = require('../../transactions/parse-transaction-data');

const buildTransaction = (rawTx, txReceipt, block) => {
  const { affiliateAddress, quoteDate } = parseTransactionData(rawTx.data);

  return {
    affiliateAddress,
    blockHash: rawTx.blockHash,
    blockNumber: rawTx.blockNumber,
    data: rawTx.data,
    date: new Date(block.timestamp * 1000),
    from: rawTx.from.toLowerCase(),
    gasLimit: rawTx.gasLimit.toNumber(),
    gasPrice: rawTx.gasPrice.toString(),
    gasUsed: txReceipt.gasUsed.toNumber(),
    hash: rawTx.hash,
    index: txReceipt.transactionIndex,
    nonce: rawTx.nonce,
    quoteDate,
    to: rawTx.to.toLowerCase(),
    value: rawTx.value.toString(),
  };
};

module.exports = buildTransaction;
