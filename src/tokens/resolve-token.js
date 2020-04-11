const _ = require('lodash');
const tokenUtils = require('ethereum-token-utils');

const { TOKEN_TYPE } = require('../constants');
const ethplorer = require('../util/ethplorer');

const resolveToken = async (address, type) => {
  const [tokenMetadata, tokenInfo] = await Promise.all([
    tokenUtils.getTokenMetadata(address, {
      rpcEndpoint: 'https://cloudflare-eth.com',
    }),
    ethplorer.getTokenInfo(address),
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

  const totalSupply = _.get(tokenInfo, 'totalSupply', null);
  const circulatingSupply = _.get(tokenInfo, 'circulatingSupply', null);

  const metadata = {
    circulatingSupply,
    decimals,
    name,
    symbol,
    totalSupply,
  };

  if (Object.values(metadata).every(value => value === null)) {
    return null;
  }

  return metadata;
};

module.exports = resolveToken;
