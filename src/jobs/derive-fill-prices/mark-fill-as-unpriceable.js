const { FILL_PRICING_STATUS } = require('../../constants');
const Fill = require('../../model/fill');

const markFillAsUnpriceable = async fillId => {
  await Fill.updateOne(
    { _id: fillId },
    { $set: { pricingStatus: FILL_PRICING_STATUS.UNPRICEABLE } },
  );
};

module.exports = markFillAsUnpriceable;
