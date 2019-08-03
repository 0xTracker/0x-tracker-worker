const getMeasurableActor = require('./get-measurable-actor');

const checkIsFillReady = fill => {
  const measurableActor = getMeasurableActor(fill);

  return (
    fill.assets.some(
      asset => asset.actor === measurableActor && asset.tokenResolved === false,
    ) === false
  );
};

module.exports = checkIsFillReady;
