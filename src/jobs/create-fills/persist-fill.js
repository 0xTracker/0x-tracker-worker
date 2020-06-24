const { getModel } = require('../../model');

/**
 * Persists a given fill to MongoDB and returns a populated
 * instance of the fill.
 * @param {*} session
 * @param {*} event
 * @param {*} fill
 */
const persistFill = async (session, fill) => {
  const Fill = getModel('Fill');
  const results = await Fill.create([fill], { session });
  const newFill = results[0];

  await Fill.populate(newFill, [{ path: 'relayer' }, { path: 'assets.token' }]);

  // A bug in Mongoose prevents assets.token from being set even though the
  // related tokens are fetched properly. We therefore have to set the value manually.
  const populatedFill = {
    ...newFill.toObject(),
    assets: newFill.assets.map(asset => {
      const token = newFill
        .populated('assets.token')
        .find(t => t.address === asset.tokenAddress);

      return { ...asset.toObject(), token };
    }),
  };

  return populatedFill;
};

module.exports = persistFill;
