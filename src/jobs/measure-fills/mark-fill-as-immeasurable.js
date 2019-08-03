const Fill = require('../../model/fill');

const markFillAsImmeasurable = async fillId => {
  await Fill.updateOne({ _id: fillId }, { $set: { immeasurable: true } });
};

module.exports = markFillAsImmeasurable;
