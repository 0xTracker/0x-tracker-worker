const mongoose = require('mongoose');

const withTransaction = async func => {
  const session = await mongoose.startSession();

  session.startTransaction();

  try {
    await func(session);
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();

    throw error;
  }

  session.endSession();
};

module.exports = withTransaction;
