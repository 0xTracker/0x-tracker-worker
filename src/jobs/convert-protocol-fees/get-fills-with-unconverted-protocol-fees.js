const { getModel } = require('../../model');

const getFillsWithUnconvertedProtocolFees = async limit => {
  const fills = await getModel('Fill')
    .find({
      'conversions.USD.protocolFee': null,
      protocolVersion: 3,
    })
    .limit(limit);

  return fills;
};

module.exports = getFillsWithUnconvertedProtocolFees;
