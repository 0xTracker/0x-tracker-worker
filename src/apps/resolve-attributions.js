const _ = require('lodash');
const getEntityDefinitions = require('./get-entity-definitions');

const prettifyUndefined = value => (value === undefined ? '(none)' : value);

const getErrorForDuplicate = (type, metadata) => {
  const { affiliateAddress, feeRecipientAddress, takerAddress } = metadata;

  return new Error(
    `Multiple ${type} attribution entities match metadata:` +
      '\r\n\r\n' +
      `affiliateAddress: ${prettifyUndefined(affiliateAddress)}\r\n` +
      `feeRecipientAddress: ${prettifyUndefined(feeRecipientAddress)}\r\n` +
      `takerAddress: ${prettifyUndefined(takerAddress)}`,
  );
};

const resolveAttributions = metadata => {
  const { affiliateAddress, feeRecipientAddress, takerAddress } = metadata;

  const entityDefinitions = getEntityDefinitions();
  const mappings = _.flatMap(entityDefinitions, d => d.mappings);
  const matches = mappings.filter(
    mapping =>
      (mapping.affiliateAddress === affiliateAddress ||
        mapping.affiliateAddress === undefined) &&
      (mapping.feeRecipientAddress === feeRecipientAddress ||
        mapping.feeRecipientAddress === undefined) &&
      (mapping.takerAddress === takerAddress ||
        mapping.takerAddress === undefined),
  );

  // TODO: Make this guard dynamic based on types constant
  if (matches.filter(m => m.type === 'relayer').length > 1) {
    throw getErrorForDuplicate('relayer', metadata);
  }

  if (matches.filter(m => m.type === 'consumer').length > 1) {
    throw getErrorForDuplicate('consumer', metadata);
  }

  return matches.map(match => {
    const definition = entityDefinitions.find(d => d.mappings.includes(match));

    return {
      id: definition.id,
      type: match.type,
    };
  });
};

module.exports = resolveAttributions;
