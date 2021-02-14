const _ = require('lodash');

const { TOKEN_TYPE } = require('../constants');
const ethplorer = require('../util/ethplorer');
const getTokenMetadata = require('../util/ethereum/get-token-metadata');

const resolveToken = async (address, type) => {
  const [tokenMetadata, tokenInfo] = await Promise.all([
    getTokenMetadata(address, {
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
