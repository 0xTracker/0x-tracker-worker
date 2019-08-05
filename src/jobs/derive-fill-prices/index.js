const bluebird = require('bluebird');
const signale = require('signale');

const fetchUnpricedFills = require('./fetch-unpriced-fills');
const priceFill = require('./price-fill');

const logger = signale.scope('derive fill prices');

const deriveFillPrices = async ({ batchSize }) => {
  const fills = await fetchUnpricedFills(batchSize);

  logger.info(`found ${fills.length} unpriced fills`);

  if (fills.length === 0) {
    return;
  }

  await bluebird.mapSeries(fills, async fill => {
    await priceFill(fill);
  });
};

module.exports = deriveFillPrices;
