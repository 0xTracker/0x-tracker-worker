const _ = require('lodash');

const relayerRegistry = require('./relayer-registry');

const getAllRelayers = () => {
  const relayers = _.mapValues(relayerRegistry, (relayer, id) => ({
    ...relayer,
    id,
  }));

  return relayers;
};

module.exports = getAllRelayers;
