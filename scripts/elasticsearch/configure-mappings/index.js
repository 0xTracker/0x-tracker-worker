const configureMappings = async (esClient, logger) => {
  await esClient.indices.putMapping({
    index: 'fills',
    body: {
      properties: {
        tradeCountContribution: {
          type: 'float',
        },
      },
    },
  });
  logger.success('configured mappings: fills');
};

module.exports = configureMappings;
