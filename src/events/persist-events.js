const { getModel } = require('../model');

const persistEvents = async (events, options) => {
  const Event = getModel('Event');

  await Event.create(events, options);
};

module.exports = persistEvents;
