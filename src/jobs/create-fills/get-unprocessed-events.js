const Event = require('../../model/event');

const getUnprocessedEvents = async batchSize => {
  const SUPPORTED_VERSIONS = [1, 2, 3];
  const events = await Event.find({
    fillCreated: { $in: [false, null] },
    protocolVersion: { $in: SUPPORTED_VERSIONS },
    type: { $in: ['Fill', 'LogFill'] },
  }).limit(batchSize);

  return events;
};

module.exports = getUnprocessedEvents;
