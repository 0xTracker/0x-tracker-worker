const Event = require('../../model/event');

const getUnprocessedEvents = async count => {
  const events = await Event.find({
    fillCreated: { $in: [false, null] },
  }).limit(count);

  return events;
};

module.exports = getUnprocessedEvents;
