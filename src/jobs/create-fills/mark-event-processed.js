const { getModel } = require('../../model');

const markEventProcessed = async eventId => {
  const Event = getModel('Event');
  await Event.updateOne({ _id: eventId }, { fillCreated: true });
};

module.exports = markEventProcessed;
