class UnsupportedAssetError extends Error {
  constructor(...args) {
    super(...args);
    Error.captureStackTrace(this, UnsupportedAssetError);
  }
}

module.exports = UnsupportedAssetError;
