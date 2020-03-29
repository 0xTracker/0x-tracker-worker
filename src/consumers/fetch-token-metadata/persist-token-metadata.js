const Token = require('../../model/token');

const persisTokenMetadata = async (tokenAddress, tokenMetadata, session) => {
  const result = await Token.updateOne(
    { address: tokenAddress },
    { $set: { ...tokenMetadata, resolved: true } },
    { session },
  );

  // This error may indicate that the token document has not replicated
  // across all MongoDB replicas yet.
  if (result.nModified !== 1) {
    throw new Error(`Could not persist metadata of token: ${tokenAddress}`);
  }
};

module.exports = persisTokenMetadata;
