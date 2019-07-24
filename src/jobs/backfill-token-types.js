const signale = require('signale');

const { TOKEN_TYPE } = require('../constants');
const Fill = require('../model/fill');
const Token = require('../model/token');

const logger = signale.scope('backfill token types');

const getTokenType = assetProxyId => {
  return {
    '0xf47261b0': TOKEN_TYPE.ERC20,
    '0x02571792': TOKEN_TYPE.ERC721,
  }[assetProxyId];
};

const backfillTokenTypes = async () => {
  const tokens = await Token.find({ type: null }).limit(100);

  logger.info(`found ${tokens.length} without their type set`);

  if (tokens.length === 0) {
    return;
  }

  await Promise.all(
    tokens.map(async token => {
      const fill = await Fill.findOne({ 'assets.tokenAddress': token.address });

      if (fill === null) {
        logger.warn(`unable to find fill matching ${token.address}`);
        return;
      }

      let tokenType;

      if (
        fill.protocolVersion === 1 ||
        fill.protocolVersion === undefined ||
        fill.protocolVersion === null
      ) {
        tokenType = TOKEN_TYPE.ERC20;
      } else if (fill.makerAsset.tokenAddress === token.address) {
        tokenType = getTokenType(fill.makerAsset.assetProxyId);
      } else {
        tokenType = getTokenType(fill.takerAsset.assetProxyId);
      }

      console.log(tokenType);

      token.set({ type: tokenType });
      await token.save();

      logger.success(`set token type for ${token.address}`);
    }),
  );
};

module.exports = backfillTokenTypes;
