const Fill = require('../../model/fill');

const fetchUnpricedFills = async batchSize => {
  const fills = await Fill.find({
    hasValue: true,
    pricingStatus: null,
    assets: {
      $not: { $elemMatch: { tokenResolved: false } },
    },
  }).limit(batchSize);

  return fills;
};

module.exports = fetchUnpricedFills;
