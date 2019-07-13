const Event = require('../../model/event');
const Fill = require('../../model/fill');
const withTransaction = require('../../util/with-transaction');

const persistFill = async (event, fill) => {
  await withTransaction(async session => {
    await Fill.create([fill], { session });
    await Event.updateOne(
      { _id: event._id },
      { fillCreated: true },
      { session },
    );
  });
};

module.exports = persistFill;
