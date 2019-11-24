const Event = require('../../model/event');
const Fill = require('../../model/fill');

const persistFill = async (session, event, fill) => {
  const results = await Fill.create([fill], { session });
  const newFill = results[0];

  await Event.updateOne({ _id: event._id }, { fillCreated: true }, { session });

  return newFill;
};

module.exports = persistFill;
