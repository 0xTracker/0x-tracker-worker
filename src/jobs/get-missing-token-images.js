const _ = require('lodash');
const { compact, flow, map } = require('lodash/fp');
const axios = require('axios');
const signale = require('signale');

const Token = require('../model/token');

const logger = signale.scope('get missing token images');

const getAssetsTreeSHA = async () => {
  const response = await axios.get(
    'https://api.github.com/repos/TrustWallet/assets/contents/blockchains/ethereum',
  );

  const assetsTree = response.data.find(
    tree => tree.path === 'blockchains/ethereum/assets',
  );

  return assetsTree.sha;
};

const getTree = async treeSHA => {
  const response = await axios.get(
    `https://api.github.com/repos/TrustWallet/assets/git/trees/${treeSHA}`,
  );

  return response.data.tree;
};

const getMissingTokenImages = async () => {
  const tokens = await Token.find({}, '_id address imageUrl').lean();
  const filteredTokens = tokens.filter(token => _.isEmpty(token.imageUrl));

  logger.info(`${filteredTokens.length} tokens were found without images`);
  logger.pending('fetching images from Trust Wallet repository');

  const assetsTreeSHA = await getAssetsTreeSHA();
  const assetsTree = await getTree(assetsTreeSHA);

  const operations = flow(
    map(token => {
      const assetTree = _.find(
        assetsTree,
        tree => tree.path.toUpperCase() === token.address.toUpperCase(),
      );

      if (assetTree === undefined) {
        return null;
      }

      const assetPath = `blockchains/ethereum/assets/${assetTree.path}/logo.png`;

      return {
        updateOne: {
          filter: { _id: token._id },
          update: {
            $set: {
              imageUrl: `https://raw.githubusercontent.com/TrustWallet/assets/master/${assetPath}`,
            },
          },
        },
      };
    }),
    compact,
  )(filteredTokens);

  if (operations.length === 0) {
    logger.info('no new token images were found');
    return;
  }

  await Token.bulkWrite(operations);

  logger.success(`updated images of ${operations.length} tokens`);
};

module.exports = getMissingTokenImages;
