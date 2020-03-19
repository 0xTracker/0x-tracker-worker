const _ = require('lodash');
const { getTokenMetadata } = require('ethereum-token-utils');
const { getTokenInfo } = require('../util/ethplorer');
const { TOKEN_TYPE } = require('../constants');

const resolveToken = async (address, type) => {
  const [tokenMetadata, tokenInfo] = await Promise.all([
    getTokenMetadata(address, {
      rpcEndpoint: 'https://cloudflare-eth.com',
    }),
    getTokenInfo(address),
  ]);
  const name = _.get(tokenMetadata, 'name', _.get(tokenInfo, 'name', null));
  const symbol = _.get(
    tokenMetadata,
    'symbol',
    _.get(tokenInfo, 'symbol', null),
  );
  const decimals =
    type === TOKEN_TYPE.ERC721
      ? 1
      : _.get(tokenMetadata, 'decimals', _.get(tokenInfo, 'decimals', null));

  if (decimals === null || name === null || symbol === null) {
    return null;
  }

  return {
    decimals,
    name,
    symbol,
  };
};

module.exports = resolveToken;
