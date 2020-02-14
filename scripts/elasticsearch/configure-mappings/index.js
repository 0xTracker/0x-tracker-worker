const configureMappings = async (esClient, logger) => {
  await esClient.indices.putMapping({
    index: 'fills',
    body: {
      properties: {
        date: {
          type: 'date',
        },
        makerFees: {
          type: 'float',
        },
        protocolFeeETH: {
          type: 'long',
        },
        protocolFeeUSD: {
          type: 'float',
        },
        protocolVersion: {
          type: 'long',
        },
        relayerId: {
          type: 'long',
        },
        status: {
          type: 'long',
        },
        takerFees: {
          type: 'float',
        },
        tradeCountContribution: {
          type: 'float',
        },
        updatedAt: {
          type: 'date',
        },
        value: {
          type: 'float',
        },
      },
    },
  });
  logger.success('configured mappings: fills');
};

module.exports = configureMappings;
