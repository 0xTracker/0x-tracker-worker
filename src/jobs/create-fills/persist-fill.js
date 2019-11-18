const { getModel } = require('../../model');

const persistFill = async (session, event, fill) => {
  const results = await getModel('Fill').create([fill], { session });
  const newFill = results[0];

  await getModel('Event').updateOne(
    { _id: event._id },
    { fillCreated: true },
    { session },
  );

  return newFill;
};

module.exports = persistFill;
