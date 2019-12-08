const { getModel } = require('../../model');

const markFillAsImmeasurable = async fillId => {
  await getModel('Fill').updateOne(
    { _id: fillId },
    { $set: { immeasurable: true } },
  );
};

module.exports = markFillAsImmeasurable;
