const { QUEUE, JOB } = require('../constants');
const { publishJob } = require('../queues');

const measureFill = async fillId => {
  await publishJob(QUEUE.PRICING, JOB.MEASURE_FILL, { fillId });
};

module.exports = measureFill;
