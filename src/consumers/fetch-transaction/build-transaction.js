const _ = require('lodash');
const parseTransactionData = require('../../transactions/parse-transaction-data');

const buildTransaction = (rawTx, txReceipt, block) => {
  const { affiliateAddress, quoteDate } = parseTransactionData(rawTx.data);

  return {
    affiliateAddress,
    blockHash: rawTx.blockHash,
    blockNumber: rawTx.blockNumber,
    data: rawTx.data,
    date: new Date(block.timestamp * 1000),
    from: _.lowerCase(rawTx.from),
    gasLimit: _.toNumber(rawTx.gasLimit),
    gasPrice: _.toString(rawTx.gasPrice),
    gasUsed: _.toNumber(txReceipt.gasUsed),
    hash: rawTx.hash,
    index: txReceipt.transactionIndex,
    nonce: rawTx.nonce,
    quoteDate,
    to: _.lowerCase(rawTx.to),
    value: _.toString(rawTx.value),
  };
};

module.exports = buildTransaction;
