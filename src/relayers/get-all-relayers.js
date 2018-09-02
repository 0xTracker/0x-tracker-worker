const _ = require('lodash');

const ercDEXRecipientCache = require('./erc-dex/recipient-cache');
const relayerRegistry = require('./relayer-registry');

const getAllRelayers = () => {
  const relayers = _.mapValues(relayerRegistry, (relayer, id) => ({
    ...relayer,
    id,
  }));

  return {
    ...relayers,
    ercDex: {
      ...relayers.ercDex,
      feeRecipients: ercDEXRecipientCache.getRecipients(),
    },
  };
};

module.exports = getAllRelayers;
