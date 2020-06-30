const _ = require('lodash');

const hasRelayerFees = fill => {
  return _.some(fill.fees, fee => fee.amount.token > 0);
};

module.exports = hasRelayerFees;
