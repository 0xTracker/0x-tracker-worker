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
    'https://api.github.com/repos/TrustWallet/assets/git/trees/master?recursive=1',
  );

  if (!_.isArray(_.get(response, 'data.tree'))) {
    throw new Error(
      'Data returned by Trust Wallet repository was in unexpected format',
    );
  }

  const operations = flow(
    map(token => {
      const image = _.find(
        response.data.tree,
        item =>
          item.path.toUpperCase() ===
          `blockchains/ethereum/assets/${token.address}/logo.png`.toUpperCase(),
      );

      if (_.isUndefined(image) || token.imageUrl !== null) {
        return null;
      }

      return {
        updateOne: {
          filter: { _id: token._id },
          update: {
            $set: {
              imageUrl: `https://raw.githubusercontent.com/TrustWallet/assets/master/${image.path}`,
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
