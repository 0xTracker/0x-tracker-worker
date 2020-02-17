const createIndexes = async (esClient, logger) => {
  const response = await esClient.indices.exists({ index: 'fills' });

  if (!response.body) {
    await esClient.indices.create({ index: 'fills' });
    logger.success('created index: fills');
  } else {
    logger.info('index already exists: fills');
  }
};

module.exports = createIndexes;
