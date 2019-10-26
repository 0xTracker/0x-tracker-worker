class UnsupportedFeeError extends Error {
  constructor(...args) {
    super(...args);
    Error.captureStackTrace(this, UnsupportedFeeError);
  }
}

module.exports = UnsupportedFeeError;
