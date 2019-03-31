const Event = require('../../model/event');

const getUnprocessedEvents = async (count, order) => {
  const events = await Event.find({
    fillCreated: { $in: [false, null] },
  })
    .sort({ blockNumber: order })
    .limit(count);

  return events;
};

module.exports = getUnprocessedEvents;
