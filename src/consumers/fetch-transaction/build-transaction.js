const getAffiliateAddress = require('../../transactions/get-affiliate-address');
const getQuoteDate = require('../../transactions/get-quote-date');

const buildTransaction = (rawTx, txReceipt, block) => {
  return {
    affiliateAddress: getAffiliateAddress(rawTx.data),
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
    quoteDate: getQuoteDate(rawTx.data),
    to: rawTx.to ? rawTx.to.toLowerCase() : undefined,
    value: rawTx.value.toString(),
  };
};

module.exports = buildTransaction;
