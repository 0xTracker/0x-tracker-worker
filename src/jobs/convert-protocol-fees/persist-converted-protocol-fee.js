const Fill = require('../../model/fill');

const persistConvertedProtocolFee = async (fillId, convertedProtocolFee) => {
  await Fill.updateOne(
    { _id: fillId },
    { $set: { 'conversions.USD.protocolFee': convertedProtocolFee } },
  );
};

module.exports = persistConvertedProtocolFee;
