const parseTransactionData = require('../../transactions/parse-transaction-data');

const buildTransaction = (rawTx, txReceipt, block) => {
  const { affiliateAddress, quoteDate } = parseTransactionData(rawTx.input);

  return {
    affiliateAddress,
    blockHash: rawTx.blockHash,
    blockNumber: rawTx.blockNumber,
    data: rawTx.input,
    date: new Date(block.timestamp * 1000),
    from: rawTx.from,
    gasLimit: rawTx.gas,
    gasPrice: rawTx.gasPrice.toString(),
    gasUsed: txReceipt.gasUsed,
    hash: rawTx.hash,
    index: txReceipt.transactionIndex,
    nonce: rawTx.nonce,
    quoteDate,
    to: rawTx.to,
    value: rawTx.value.toString(),
  };
};

module.exports = buildTransaction;
