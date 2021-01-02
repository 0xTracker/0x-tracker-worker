const _ = require('lodash');
const getEntityDefinitions = require('./get-entity-definitions');

const prettifyUndefined = value => (value === undefined ? '(none)' : value);

const getErrorForDuplicate = (type, metadata) => {
  const {
    affiliateAddress,
    feeRecipientAddress,
    senderAddress,
    takerAddress,
    transactionToAddress,
  } = metadata;

  return new Error(
    `Multiple ${type} attribution entities match metadata:` +
      '\r\n\r\n' +
      `affiliateAddress: ${prettifyUndefined(affiliateAddress)}\r\n` +
      `feeRecipientAddress: ${prettifyUndefined(feeRecipientAddress)}\r\n` +
      `senderAddress: ${prettifyUndefined(senderAddress)}\r\n` +
      `takerAddress: ${prettifyUndefined(takerAddress)}\r\n` +
      `transactionToAddress: ${prettifyUndefined(transactionToAddress)}`,
  );
};

const sanitizeMetadata = metadata =>
  _.mapValues(metadata, value => value || null);

const resolveAttributions = metadata => {
  const {
    affiliateAddress,
    feeRecipientAddress,
    senderAddress,
    takerAddress,
    transactionToAddress,
  } = sanitizeMetadata(metadata);

  const entityDefinitions = getEntityDefinitions();
  const mappings = _.flatMap(entityDefinitions, d => d.mappings);

  const matches = mappings.filter(
    mapping =>
      (mapping.affiliateAddress === affiliateAddress ||
        mapping.affiliateAddress === undefined) &&
      (mapping.feeRecipientAddress === feeRecipientAddress ||
        mapping.feeRecipientAddress === undefined) &&
      (mapping.takerAddress === takerAddress ||
        mapping.takerAddress === undefined) &&
      (mapping.senderAddress === senderAddress ||
        mapping.senderAddress === undefined) &&
      (mapping.transactionToAddress === transactionToAddress ||
        mapping.transactionToAddress === undefined),
  );

  const attributions = _.uniqWith(
    matches.map(match => {
      const definition = entityDefinitions.find(d =>
        d.mappings.includes(match),
      );

      return {
        id: definition.id,
        type: match.type,
      };
    }),
    _.isEqual,
  );

  // TODO: Make this guard dynamic based on types constant
  if (attributions.filter(a => a.type === 'relayer').length > 1) {
    throw getErrorForDuplicate('relayer', metadata);
  }

  if (attributions.filter(a => a.type === 'consumer').length > 1) {
    throw getErrorForDuplicate('consumer', metadata);
  }

  return attributions;
};

module.exports = resolveAttributions;
