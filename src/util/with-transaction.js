const mongoose = require('mongoose');

const { logError } = require('../util/error-logger');

const endSession = session => {
  session.endSession(error => {
    if (error !== null) {
      logError(error);
    }
  });
};

const withTransaction = async func => {
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(() => func(session));
    endSession(session);
  } catch (error) {
    endSession(session);
    throw error;
  }
};

module.exports = withTransaction;
