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

  // This error may indicate that the fill document has not replicated
  // across all MongoDB replicas yet.
  if (result.nModified !== 1) {
    throw new Error(
      `Could not persist converted protocol fee of fill: ${fillId}`,
    );
  }
};

module.exports = persistConvertedProtocolFee;
