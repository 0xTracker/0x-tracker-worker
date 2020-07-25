const _ = require('lodash');
const { getAppDefinitions, validateAppDefinition } = require('.');

describe('definitions/apps', () => {
  it('should not contain definitions which violate the app definition schema', () => {
    const definitions = getAppDefinitions();

    definitions.forEach(definition => {
      validateAppDefinition(definition);
    });
  });

  it('should not contain multiple definitions with the same id', () => {
    const definitions = getAppDefinitions();
    const uniqueIds = _(definitions)
      .map(d => d.id)
      .uniq()
      .size();

    expect(uniqueIds).toBe(definitions.length);
  });

  it('should not contain multiple definitions with the same taker address', () => {
    const definitions = getAppDefinitions();
    const takerAddresses = _(definitions)
      .map(d => d.mappings.map(m => m.takerAddress))
      .flatten()
      .uniq()
      .value();

    const definitionsWithMatchingTakerAddresses = definitions.filter(d =>
      d.mappings.some(m => takerAddresses.includes(m.takerAddress)),
    ).length;

    expect(definitionsWithMatchingTakerAddresses).toBe(definitions.length);
  });

  it('should not contain multiple definitions with the same fee recipient address', () => {
    const definitions = getAppDefinitions();
    const feeRecipientAddresses = _(definitions)
      .map(d => d.mappings.map(m => m.feeRecipientAddress))
      .flatten()
      .uniq()
      .value();

    const matchingDefinitions = definitions.filter(d =>
      d.mappings.some(m =>
        feeRecipientAddresses.includes(m.feeRecipientAddress),
      ),
    ).length;

    expect(matchingDefinitions).toBe(definitions.length);
  });

  it('should not contain multiple definitions with the same affiliate address', () => {
    const definitions = getAppDefinitions();
    const affiliateAddresses = _(definitions)
      .map(d => d.mappings.map(m => m.affiliateAddress))
      .flatten()
      .uniq()
      .value();

    const matchingDefinitions = definitions.filter(d =>
      d.mappings.some(m => affiliateAddresses.includes(m.affiliateAddress)),
    ).length;

    expect(matchingDefinitions).toBe(definitions.length);
  });

  describe('getDefinitions', () => {
    it('should get all app definitions', () => {
      const definitions = getAppDefinitions();

      expect(definitions.length).not.toBe(0);
    });
  });
});
