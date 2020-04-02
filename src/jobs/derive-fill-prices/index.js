const bluebird = require('bluebird');
const signale = require('signale');

const fetchUnpricedFills = require('./fetch-unpriced-fills');
const priceFill = require('./price-fill');

const logger = signale.scope('derive fill prices');

const deriveFillPrices = async ({ batchSize }) => {
  const fills = await fetchUnpricedFills(batchSize);

  if (fills.length === 0) {
    logger.info('no unpriced fills were found');
    return;
  }

  logger.info(`found unpriced fills: ${fills.length}`);

  await bluebird.mapSeries(fills, async fill => {
    const result = await priceFill(fill);

    if (result) {
      logger.success(`priced fill: ${fill._id}`);
    } else {
      logger.info(`marked fill as unpriceable: ${fill._id}`);
    }
  });

  logger.info(`finished pricing fills: ${fills.length}`);
};

module.exports = deriveFillPrices;
