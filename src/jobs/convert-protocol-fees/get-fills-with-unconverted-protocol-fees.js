const Fill = require('../../model/fill');

const getFillsWithUnconvertedProtocolFees = async limit => {
  const fills = await Fill.find({
    'conversions.USD.protocolFee': null,
    protocolVersion: 3,
  }).limit(limit);

  return fills;
};

module.exports = getFillsWithUnconvertedProtocolFees;
