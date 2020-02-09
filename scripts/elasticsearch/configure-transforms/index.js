const transforms = require('./transforms');

const configureTransforms = async (esClient, logger) => {
  await Promise.all(
    transforms.map(async transform => {
      const { config, name } = transform;
      const response = await esClient.transform.getTransform();

      if (response.body.transforms.some(test => test.id === name)) {
        await esClient.transform.stopTransform({
          transform_id: name,
          wait_for_completion: true,
        });

        await esClient.transform.deleteTransform({
          transform_id: name,
        });
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
