const _ = require('lodash');
const getAppDefinitions = require('./get-app-definitions');

const prettifyUndefined = value => (value === undefined ? '(none)' : value);

const getErrorForDuplicate = (type, metadata) => {
  const { affiliateAddress, feeRecipientAddress, takerAddress } = metadata;

  return new Error(
    `Multiple ${type} apps match metadata:` +
      '\r\n\r\n' +
      `affiliateAddress: ${prettifyUndefined(affiliateAddress)}\r\n` +
      `feeRecipientAddress: ${prettifyUndefined(feeRecipientAddress)}\r\n` +
      `takerAddress: ${prettifyUndefined(takerAddress)}`,
  );
};

const resolveApps = metadata => {
  const { affiliateAddress, feeRecipientAddress, takerAddress } = metadata;

  const appDefinitions = getAppDefinitions();
  const mappings = _.flatMap(appDefinitions, d => d.mappings);
  const matches = mappings.filter(
    mapping =>
      (mapping.affiliateAddress === affiliateAddress ||
        mapping.affiliateAddress === undefined) &&
      (mapping.feeRecipientAddress === feeRecipientAddress ||
        mapping.feeRecipientAddress === undefined) &&
      (mapping.takerAddress === takerAddress ||
        mapping.takerAddress === undefined),
  );

  if (matches.filter(m => m.type === 'relayer').length > 1) {
    throw getErrorForDuplicate('relayer', metadata);
  }

  if (matches.filter(m => m.type === 'consumer').length > 1) {
    throw getErrorForDuplicate('consumer', metadata);
  }

  return matches.map(match => {
    const appDefinition = appDefinitions.find(d => d.mappings.includes(match));

    return {
      id: appDefinition.id,
      type: match.type,
    };
  });
};

module.exports = resolveApps;
