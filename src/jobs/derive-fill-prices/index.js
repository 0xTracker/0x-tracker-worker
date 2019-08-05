const bluebird = require('bluebird');
const signale = require('signale');

const checkIsFillUnpriceable = require('./check-is-fill-unpriceable');
const fetchUnpricedFills = require('./fetch-unpriced-fills');
const markFillAsUnpriceable = require('./mark-fill-as-unpriceable');
const priceFill = require('./price-fill');

const logger = signale.scope('derive fill prices');

const deriveFillPrices = async ({ batchSize }) => {
  const fills = await fetchUnpricedFills(batchSize);

  logger.info(`found ${fills.length} unpriced fills`);

  if (fills.length === 0) {
    return;
  }

  await bluebird.mapSeries(fills, async fill => {
    if (checkIsFillUnpriceable(fill)) {
      await markFillAsUnpriceable(fill._id);

      logger.info(`marked fill ${fill._id} as unpriceable`);
    } else {
      await priceFill(fill);

      logger.success(`priced fill ${fill._id}`);
    }
  });
};

module.exports = deriveFillPrices;
