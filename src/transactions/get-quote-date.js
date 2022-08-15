const getQuoteDate = callData => {
  if (!callData.includes('869584cd')) {
    return null;
  }

  const bytesPos = callData.indexOf('869584cd');
  const ms =
    parseInt(callData.slice(bytesPos + 128, bytesPos + 136), 16) * 1000;

  if (Number.isNaN(ms)) {
    return null;
  }

  return new Date(ms);
};

module.exports = getQuoteDate;
