const configureSettings = async (esClient, logger) => {
  await esClient.indices.putSettings({
    index: 'fills',
    body: {
      index: {
        refresh_interval: '30s',
      },
    },
  });
  logger.success('configured settings: fills');
};

module.exports = configureSettings;
