const bluebird = require('bluebird');
const signale = require('signale');

const { JOB, QUEUE, ZRX_TOKEN_ADDRESS } = require('../constants');
const { getToken } = require('../tokens/token-cache');
const { getModel } = require('../model');
const { publishJob } = require('../queues');
const formatTokenAmount = require('../tokens/format-token-amount');
const getConversionRate = require('../rates/get-conversion-rate');

const logger = signale.scope('convert fees');

const SUPPORTED_VERSIONS = [1, 2];

const convertAmount = (amount, conversionRate) => {
  if (amount === 0) {
    return 0;
  }

  const zrxToken = getToken(ZRX_TOKEN_ADDRESS);
  const formattedAmount = formatTokenAmount(amount, zrxToken);

  return formattedAmount * conversionRate;
};

const convertFees = async ({ batchSize }) => {
  const Fill = getModel('Fill');

  // Fetch a batch of fills for processing where the maker or taker
  // fee have not yet been converted.
  const fills = await Fill.find({
    $or: [
      { 'conversions.USD.makerFee': null },
      { 'conversions.USD.takerFee': null },
    ],
    protocolVersion: { $in: SUPPORTED_VERSIONS },
  })
    .limit(batchSize)
    .lean();

  logger.info(`found ${fills.length} fills without converted fees`);

  if (fills.length === 0) {
    return;
  }

  await bluebird.mapSeries(fills, async fill => {
    if (fill.makerFee + fill.takerFee === 0) {
      await Fill.updateOne(
        { _id: fill._id },
        {
          $set: {
            'conversions.USD.makerFee': 0,
            'conversions.USD.takerFee': 0,
          },
        },
      );

      await publishJob(QUEUE.FILL_INDEXING, JOB.INDEX_FILL_FEES, {
        fillId: fill._id,
        makerFees: 0,
        takerFees: 0,
      });

      logger.success(`Skipped fee conversion for fill ${fill._id}`);
    } else {
      logger.time(`Fetch ZRX conversion rate for ${fill.date}`);
      const conversionRate = await getConversionRate('ZRX', 'USD', fill.date);
      logger.timeEnd(`Fetch ZRX conversion rate for ${fill.date}`);

      if (conversionRate === undefined) {
        logger.warn(`Unable to fetch ZRX conversion rate for ${fill.date}`);
        return;
      }

      const makerFee = convertAmount(fill.makerFee, conversionRate);
      const takerFee = convertAmount(fill.takerFee, conversionRate);

      await Fill.updateOne(
        { _id: fill._id },
        {
          $set: {
            'conversions.USD.makerFee': makerFee,
            'conversions.USD.takerFee': takerFee,
            'rates.ZRX.USD': conversionRate,
          },
        },
      );

      await publishJob(QUEUE.FILL_INDEXING, JOB.INDEX_FILL_FEES, {
        fillId: fill._id,
        makerFees: makerFee,
        takerFees: takerFee,
      });

      logger.success(`Converted fees for fill ${fill._id}`);
    }
  });
};

module.exports = convertFees;
