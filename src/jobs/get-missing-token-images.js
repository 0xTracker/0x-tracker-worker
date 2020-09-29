const _ = require('lodash');
const { compact, flow, map } = require('lodash/fp');
const axios = require('axios');
const signale = require('signale');

const Token = require('../model/token');

const logger = signale.scope('get missing token images');

const getMissingTokenImages = async () => {
  const tokens = await Token.find({}, '_id address imageUrl').lean();

  logger.info(`${tokens.length} tokens were found`);
  logger.pending('fetching images from Trust Wallet repository');

  const response = await axios.get(
    'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/allowlist.json',
  );

  if (!_.isArray(_.get(response, 'data'))) {
    throw new Error(
      'Data returned by Trust Wallet repository was in unexpected format',
    );
  }

  const addressesWithImages = response.data;

  const operations = flow(
    map(token => {
      const match = _.find(
        addressesWithImages,
        address => address.toUpperCase() === token.address.toUpperCase(),
      );

      if (_.isNil(match) || _.isString(token.imageUrl)) {
        return null;
      }

      return {
        updateOne: {
          filter: { _id: token._id },
          update: {
            $set: {
              imageUrl: `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${match}/logo.png`,
            },
          },
        },
      };
    }),
    compact,
  )(tokens);

  if (operations.length === 0) {
    logger.info('no new token images were found');
    return;
  }

  await Token.bulkWrite(operations);

  logger.success(`updated images of ${operations.length} tokens`);
};

module.exports = getMissingTokenImages;
