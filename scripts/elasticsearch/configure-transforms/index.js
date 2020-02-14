const transforms = require('./transforms');

const configureTransforms = async (esClient, logger) => {
  await Promise.all(
    transforms.map(async transform => {
      const { config, name } = transform;
      const response = await esClient.transform.getTransform();

      if (response.body.transforms.some(test => test.id === name)) {
        logger.info(`transform already exists: ${name}`);

        return;
      }

      await esClient.transform.putTransform({
        transform_id: name,
        body: config,
      });

      await esClient.transform.startTransform({
        transform_id: name,
      });

      logger.success(`configured transform: ${name}`);
    }),
  );
};

module.exports = configureTransforms;
