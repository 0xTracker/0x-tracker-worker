const signale = require('signale');

const { getModel } = require('../model');

const logger = signale.scope('index fill');

const indexFillConsumer = async (job, done) => {
  const { fillId } = job.data;
  const fill = await getModel('Fill').findOne({ _id: fillId });

  logger.info(`indexing fill: ${fillId}`);

  fill.index(error => {
    if (error) {
      done(error);
      return;
    }

    logger.success(`indexed fill: ${fillId}`);

    done();
  });
};

module.exports = indexFillConsumer;
