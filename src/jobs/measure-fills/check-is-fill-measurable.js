const getMeasurableActor = require('../../fills/get-measurable-actor');

const checkIsFillMeasurable = fill => {
  const measurableActor = getMeasurableActor(fill);

  return measurableActor !== null;
};

module.exports = checkIsFillMeasurable;
