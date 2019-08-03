const _ = require('lodash');

const { BASE_TOKENS } = require('../../constants');
const Fill = require('../../model/fill');

const fetchUnmeasuredFills = async batchSize => {
  const baseTokenAddresses = _.keys(BASE_TOKENS);
  const fills = await Fill.find({
    hasValue: false,
    'assets.tokenAddress': { $in: baseTokenAddresses },
    immeasurable: { $in: [null, false] },
  })
    .limit(batchSize)
    .lean();

  return fills;
};

module.exports = fetchUnmeasuredFills;
