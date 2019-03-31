const Event = require('../../model/event');
const Fill = require('../../model/fill');

// TODO: Use transactions to ensure consistency (https://docs.mongodb.com/master/core/transactions)
const persistFill = async (event, fill) => {
  await Fill.create(fill);
  await Event.updateOne({ _id: event._id }, { fillCreated: true });
};

module.exports = persistFill;
