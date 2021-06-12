const getAffiliateAddress = data => {
  if (data.includes('869584cd')) {
    const bytesPos = data.indexOf('869584cd');

    return '0x'.concat(data.slice(bytesPos + 32, bytesPos + 72));
  }

  if (data.includes('fbc019a7')) {
    const bytesPos = data.indexOf('fbc019a7');

    return '0x'.concat(data.slice(bytesPos + 32, bytesPos + 72));
  }

  return null;
};

module.exports = getAffiliateAddress;
