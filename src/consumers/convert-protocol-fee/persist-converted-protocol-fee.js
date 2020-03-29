const { getModel } = require('../../model');

const persistConvertedProtocolFee = async (
  fillId,
  convertedProtocolFee,
  dbSession,
) => {
  await getModel('Fill').updateOne(
    { _id: fillId },
    { $set: { 'conversions.USD.protocolFee': convertedProtocolFee } },
    { session: dbSession },
  );
};

module.exports = persistConvertedProtocolFee;
