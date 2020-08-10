const { getModel } = require('../model');

const persistEvents = async (events, options) => {
  const Event = getModel('Event');

  await Event.create(
    events.map(event => ({ ...event, dateIngested: new Date() })),
    options,
  );
};

module.exports = persistEvents;
