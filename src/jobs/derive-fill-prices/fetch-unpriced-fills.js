const { getModel } = require('../../model');

const fetchUnpricedFills = async batchSize => {
  const fills = await getModel('Fill')
    .find({
      hasValue: true,
      pricingStatus: null,
      assets: {
        $not: { $elemMatch: { tokenResolved: false } },
      },
    })
    .sort({ date: -1 })
    .limit(batchSize)
    .populate([{ path: 'relayer' }, { path: 'assets.token' }]);

  return fills;
};

module.exports = fetchUnpricedFills;
