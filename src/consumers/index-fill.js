const mongoose = require('mongoose');
const signale = require('signale');

const { getModel } = require('../model');

const logger = signale.scope('index fill');

const indexFillConsumer = async (job, done) => {
  const { fillId } = job.data;

  if (!mongoose.Types.ObjectId.isValid(fillId)) {
    throw new Error(`Invalid fillId: ${fillId}`);
  }

  logger.info(`indexing fill: ${fillId}`);

  const fill = await getModel('Fill').findOne({ _id: fillId });

  if (fill === null) {
    throw new Error(`No fill found with the id: ${fillId}`);
  }

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
