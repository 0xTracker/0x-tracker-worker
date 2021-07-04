const { QUEUE, JOB } = require('../constants');
const { publishJob } = require('../queues');

const measureFill = async (fillId, delayInMs) => {
  await publishJob(
    QUEUE.PRICING,
    JOB.MEASURE_FILL,
    { fillId },
    { delay: delayInMs },
  );
};

module.exports = measureFill;
