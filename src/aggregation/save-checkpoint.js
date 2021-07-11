const model = require('../model');

const saveCheckpoint = async (id, date) => {
  const Checkpoint = model.getModel('Checkpoint');

  await Checkpoint.updateOne(
    {
      _id: id,
    },
    {
      date,
      updatedAt: new Date(),
    },
    { upsert: true },
  );
};

module.exports = saveCheckpoint;
