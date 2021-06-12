const _ = require('lodash');

const { TOKEN_TYPE } = require('../constants');
const getTokenMetadata = require('../util/ethereum/get-token-metadata');

const resolveToken = async (address, type) => {
  const tokenMetadata = await getTokenMetadata(address, {
    rpcEndpoint: 'https://cloudflare-eth.com',
  });

  const name = _.get(tokenMetadata, 'name', null);
  const symbol = _.get(tokenMetadata, 'symbol', null);

  const decimals =
    type === TOKEN_TYPE.ERC721 ? 1 : _.get(tokenMetadata, 'decimals', null);

  const metadata = {
    decimals,
    name,
    symbol,
  };

  if (Object.values(metadata).every(value => value === null)) {
    return null;
  }

  return metadata;
};

module.exports = resolveToken;
