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
    .limit(batchSize);

  return fills;
};

module.exports = fetchUnpricedFills;
