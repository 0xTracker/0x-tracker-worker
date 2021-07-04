const _ = require('lodash');

const getTraderAddresses = fill => {
  const isContract = _.get(fill, 'takerMetadata.isContract');
  const txFrom = _.get(fill, 'transaction.from');

  if (isContract === undefined) {
    throw new Error('Fill does not have `takerMetadata.isContract` populated');
  }

  if (txFrom === undefined) {
    throw new Error('Fill does not have `transaction.from` populated');
  }

  return _.compact([fill.maker, isContract ? txFrom : fill.taker]);
};

module.exports = getTraderAddresses;
