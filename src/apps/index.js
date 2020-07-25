const _ = require('lodash');
const { getAppDefinitions } = require('../definitions/apps');

const resolveApps = ({
  affiliateAddress,
  feeRecipientAddress,
  takerAddress,
}) => {
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

  return matches.map(match => {
    const appDefinition = appDefinitions.find(d => d.mappings.includes(match));

    return {
      id: appDefinition.id,
      type: match.type,
    };
  });
};

module.exports = { resolveApps };
