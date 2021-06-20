const bluebird = require('bluebird');
const signale = require('signale');
const measureFill = require('../../consumers/measure-fill');
const checkIsFillMeasurable = require('../../consumers/measure-fill/check-is-fill-measurable');
const fetchUnmeasuredFills = require('./fetch-unmeasured-fills');
const markFillAsImmeasurable = require('./mark-fill-as-immeasurable');

const logger = signale.scope('measure fills');

const measureFills = async ({ batchSize }) => {
  logger.info('measuring unmeasured fills');

  const fills = await fetchUnmeasuredFills(batchSize);

  if (fills.length === 0) {
    logger.info('no unmeasured fills were found');
    return;
  }

  logger.info(`found ${fills.length} unmeasured fills`);

  await bluebird.mapSeries(fills, async fill => {
    if (fill.hasValue) {
      logger.info(`fill has already been measured: ${fill._id}`);
      return;
    }

    const isFillMeasurable = checkIsFillMeasurable(fill);

    if (isFillMeasurable) {
      await measureFill(fill);

      logger.success(`measured fill: ${fill._id}`);
    } else {
      await markFillAsImmeasurable(fill._id);

      logger.info(`marked fill as immeasurable: ${fill._id}`);
    }
  });
};

module.exports = measureFills;
