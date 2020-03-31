const bluebird = require('bluebird');
const ms = require('ms');
const signale = require('signale');

const {
  MissingBlockError,
  UnsupportedAssetError,
  UnsupportedProtocolError,
} = require('../../errors');
const convertProtocolFee = require('../../fills/convert-protocol-fee');
const createFill = require('./create-fill');
const ensureTokenExists = require('../../tokens/ensure-token-exists');
const Event = require('../../model/event');
const fetchFillStatus = require('../../fills/fetch-fill-status');
const fetchTokenMetadata = require('../../tokens/fetch-token-metadata');
const hasProtocolFee = require('../../fills/has-protocol-fee');
const indexFill = require('../../index/index-fill');
const indexTradedTokens = require('../../index/index-traded-tokens');
const persistFill = require('./persist-fill');
const withTransaction = require('../../util/with-transaction');

const logger = signale.scope('create fills');

const SUPPORTED_VERSIONS = [1, 2, 3];

const createFills = async ({ batchSize }) => {
  const events = await Event.find({
    fillCreated: { $in: [false, null] },
    protocolVersion: { $in: SUPPORTED_VERSIONS },
  }).limit(batchSize);

  logger.info(`found ${events.length} events without associated fills`);

  await bluebird.mapSeries(events, async event => {
    logger.info(`creating fill for event ${event.id}`);

    try {
      const fill = await createFill(event);

      // Ensure any new tokens are added to the tokens collection
      await Promise.all(
        fill.assets.map(async asset => {
          if (await ensureTokenExists(asset.tokenAddress, asset.tokenType)) {
            fetchTokenMetadata(
              asset.tokenAddress,
              asset.tokenType,
              ms('30 seconds'),
            );
            logger.success(`created token: ${asset.tokenAddress}`);
          }
        }),
      );

      await withTransaction(async session => {
        const newFill = await persistFill(session, event, fill);

        await fetchFillStatus(newFill._id, newFill.transactionHash, ms('30'));
        await indexFill(newFill._id, ms('30 seconds'));
        await indexTradedTokens(newFill);

        if (hasProtocolFee(newFill)) {
          await convertProtocolFee(newFill, ms('30 seconds'));
        }
      });

      logger.info(`created fill for event ${event.id}`);
    } catch (error) {
      if (error instanceof MissingBlockError) {
        logger.warn(
          `Unable to create fill for event ${event.id} due to missing block`,
        );
      } else if (error instanceof UnsupportedAssetError) {
        logger.warn(
          `Unable to create fill for event ${event.id} due to unsupported asset`,
        );
      } else if (error instanceof UnsupportedProtocolError) {
        logger.warn(
          `Unable to create fill for event ${event.id} due to unsupported protocol`,
        );
      } else {
        throw error;
      }
    }
  });
};

module.exports = createFills;
