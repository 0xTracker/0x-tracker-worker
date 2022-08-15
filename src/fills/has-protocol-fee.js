const _ = require('lodash');

const hasProtocolFee = fill => {
  return _.isFinite(fill.protocolFee);
};

module.exports = hasProtocolFee;
