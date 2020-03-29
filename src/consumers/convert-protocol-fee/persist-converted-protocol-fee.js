const { getModel } = require('../../model');

const persistConvertedProtocolFee = async (
  fillId,
  convertedProtocolFee,
  dbSession,
) => {
  const result = await getModel('Fill').updateOne(
    { _id: fillId },
    { $set: { 'conversions.USD.protocolFee': convertedProtocolFee } },
    { session: dbSession },
  );

  if (result.nModified !== 1) {
    throw new Error(
      `Could not persist converted protocol fee of fill: ${fillId}`,
    );
  }
};

module.exports = persistConvertedProtocolFee;
