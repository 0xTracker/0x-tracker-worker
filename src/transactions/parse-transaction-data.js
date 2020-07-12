const parseTransactionData = data => {
  if (data.includes('869584cd')) {
    const bytesPos = data.indexOf('869584cd');

    return {
      affiliateAddress: '0x'.concat(data.slice(bytesPos + 32, bytesPos + 72)),
      quoteDate: new Date(
        parseInt(data.slice(bytesPos + 128, bytesPos + 136), 16) * 1000,
      ),
    };
  }

  if (data.includes('fbc019a7')) {
    const bytesPos = data.indexOf('fbc019a7');

    return {
      affiliateAddress: '0x'.concat(data.slice(bytesPos + 32, bytesPos + 72)),
    };
  }

  return {};
};

module.exports = parseTransactionData;
