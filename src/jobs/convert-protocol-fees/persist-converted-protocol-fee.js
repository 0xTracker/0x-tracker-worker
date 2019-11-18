const { getModel } = require('../../model');

const persistConvertedProtocolFee = async (fillId, convertedProtocolFee) => {
  await getModel('Fill').updateOne(
    { _id: fillId },
    { $set: { 'conversions.USD.protocolFee': convertedProtocolFee } },
  );
};

module.exports = persistConvertedProtocolFee;
