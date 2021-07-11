const model = require('../model');

const getCheckpoint = async id => {
  const Checkpoint = model.getModel('Checkpoint');
  const checkpoint = await Checkpoint.findById(id);

  return checkpoint;
};

module.exports = getCheckpoint;
