const hasRelayerFees = fill => {
  if (fill.protocolVersion < 3) {
    return fill.makerFee > 0 || fill.takerFee > 0;
  }

  return Array.isArray(fill.fees) && fill.fees.length > 0;
};

module.exports = hasRelayerFees;
