class UnsupportedProtocolError extends Error {
  constructor(...args) {
    super(...args);
    Error.captureStackTrace(this, UnsupportedProtocolError);
  }
}

module.exports = UnsupportedProtocolError;
