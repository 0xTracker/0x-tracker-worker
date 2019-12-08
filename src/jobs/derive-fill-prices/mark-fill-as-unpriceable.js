const { FILL_PRICING_STATUS } = require('../../constants');
const { getModel } = require('../../model');

const markFillAsUnpriceable = async fillId => {
  await getModel('Fill').updateOne(
    { _id: fillId },
    { $set: { pricingStatus: FILL_PRICING_STATUS.UNPRICEABLE } },
  );
};

module.exports = markFillAsUnpriceable;
