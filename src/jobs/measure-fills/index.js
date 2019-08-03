const bluebird = require('bluebird');
const signale = require('signale');

const checkIsFillMeasurable = require('./check-is-fill-measurable');
const checkIsFillReady = require('./check-is-fill-ready');
const fetchUnmeasuredFills = require('./fetch-unmeasured-fills');
const markFillAsImmeasurable = require('./mark-fill-as-immeasurable');
const measureFill = require('./measure-fill');

const logger = signale.scope('measure fills');

const measureFills = async ({ batchSize }) => {
  const fills = await fetchUnmeasuredFills(batchSize);

  logger.info(`found ${fills.length} unmeasured fills`);

  if (fills.length === 0) {
    return;
  }

  await bluebird.mapSeries(fills, async fill => {
    const isFillMeasurable = checkIsFillMeasurable(fill);

    if (isFillMeasurable) {
      const isFillReady = checkIsFillReady(fill);

      if (isFillReady === false) {
        logger.warn(`fill ${fill._id} is not ready for measurement`);
        return;
      }

      await measureFill(fill);

      logger.success(`measured and saved value of fill ${fill._id}`);
    } else {
      await markFillAsImmeasurable(fill._id);

      logger.info(`marked fill ${fill._id} as immeasurable`);
    }
  });
};

module.exports = measureFills;
