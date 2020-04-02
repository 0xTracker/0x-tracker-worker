const _ = require('lodash');

const { BASE_TOKENS } = require('../../constants');
const { getModel } = require('../../model');

const fetchUnmeasuredFills = async batchSize => {
  const baseTokenAddresses = _.keys(BASE_TOKENS);
  const fills = await getModel('Fill')
    .find({
      hasValue: false,
      'assets.tokenAddress': { $in: baseTokenAddresses },
      immeasurable: { $in: [null, false] },
    })
    .limit(batchSize)
    .populate([{ path: 'relayer' }, { path: 'assets.token' }]);

  return fills;
};

module.exports = fetchUnmeasuredFills;
