class MissingBlockError extends Error {
  constructor(...args) {
    super(...args);
    Error.captureStackTrace(this, MissingBlockError);
  }
}

module.exports = MissingBlockError;
